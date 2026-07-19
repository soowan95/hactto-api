import {
  Controller,
  Post,
  Get,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Admin } from '../../../common/decorators/admin.decorator';
import { prisma } from '../../../libs/prisma';
import {
  AnswerInquiryDto,
  RejectRefundDto,
  AnswerReportDto,
} from './dtos/requests/inquiry-requests.dto';
import {
  CreateNoticeDto,
  UpdateNoticeDto,
} from './dtos/requests/notice-requests.dto';
import {
  ManageHonDto,
  GrantSubscriptionDto,
  BlockUserDto,
} from './dtos/requests/user-requests.dto';
import { CreateAdminHonEventDto } from './dtos/requests/admin-hon-event.dto';
import { SendNotificationDto } from './dtos/requests/notification-requests.dto';
import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from '../../user/domain/ports/user.port';
import { HonService } from '../../user/application/hon.service';
import { RedisService } from '../../../helpers/redis/application/redis.service';
import { BadWordsService } from '../../user/application/bad-words.service';
import { AppGateway } from '../../../app.gateway';

@ApiTags('- Admin Manager')
@Admin()
@Controller('manager')
export class ManagerController {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
    private readonly honService: HonService,
    private readonly redisService: RedisService,
    private readonly badWordsService: BadWordsService,
    private readonly appGateway: AppGateway,
  ) {}

  @ApiOperation({ summary: 'Get all inquiries for admin' })
  @Get('inquiries')
  async getAllInquiries(@Query('type') type?: string) {
    const where: any = {};
    if (type && type !== 'ALL') {
      where.type = type;
    }

    const inquiries = await prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          include: {
            hon: true,
            subscription: true,
          },
        },
      },
    });

    // Calculate refund details for REFUND inquiries
    const enrichedInquiries = await Promise.all(
      inquiries.map(async (inq) => {
        if (inq.type === 'REFUND') {
          // Find all successful payments
          const payments = await prisma.paymentProjection.findMany({
            where: { userId: inq.userId, status: 'PAID' },
            orderBy: { createdAt: 'desc' },
          });

          if (payments.length > 0) {
            let totalChargedHon = 0;
            let totalPaymentAmount = 0;
            for (const p of payments) {
              let ch = 0;
              if (p.amount === 1000) ch = 30;
              else if (p.amount === 3000) ch = 100;
              else if (p.amount === 5000) ch = 200;
              totalChargedHon += ch;
              totalPaymentAmount += p.amount;
            }

            const currentFree = inq.user.hon?.freeBalance ?? 0;
            const currentPaid = inq.user.hon?.paidBalance ?? 0;
            const totalBalance = currentFree + currentPaid;
            let refundAmount = 0;

            const latestPayment = payments[0];
            const isSubscription =
              latestPayment.amount === 12000 || latestPayment.amount === 100000;

            if (isSubscription) {
              const paymentDate = latestPayment.createdAt;
              const now = inq.createdAt;
              const daysSincePayment = Math.floor(
                (now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24),
              );
              const isWithin7Days = daysSincePayment <= 7;

              const predictions = await prisma.prediction.findMany({
                where: {
                  userId: inq.userId,
                  createdAt: { gte: paymentDate },
                },
                include: { algorithm: true },
              });
              const personalPredictions =
                await prisma.personalPrediction.findMany({
                  where: {
                    userId: inq.userId,
                    createdAt: { gte: paymentDate },
                  },
                });

              let usedValue = 0;
              for (const pred of predictions) {
                usedValue += (pred.algorithm?.complexity || 0) * 50;
              }
              usedValue += personalPredictions.length * 250;

              const paymentAmount = latestPayment.amount;
              const penalty = Math.floor(paymentAmount * 0.1);

              if (isWithin7Days && usedValue === 0) {
                refundAmount = paymentAmount; // 100% 환불
              } else {
                refundAmount = Math.max(0, paymentAmount - penalty - usedValue);
              }
            } else {
              if (currentPaid > 0 && totalChargedHon > 0) {
                const remainingHon = Math.min(totalChargedHon, currentPaid);
                const usedHon = totalChargedHon - remainingHon;
                refundAmount = Math.max(
                  0,
                  Math.floor(totalPaymentAmount * 0.9 - usedHon * 50),
                );
              }
            }

            return {
              ...inq,
              paymentInfo: {
                paymentId: payments[0].paymentId, // for backward compatibility/reference
                amount: totalPaymentAmount,
                chargedHon: totalChargedHon,
                currentBalance: totalBalance,
                calculatedRefundAmount: refundAmount,
                createdAt: payments[0].createdAt,
              },
            };
          }
        }
        return inq;
      }),
    );

    return { success: true, data: enrichedInquiries };
  }

  @ApiOperation({ summary: 'Answer an inquiry' })
  @Post('inquiries/:id/answer')
  async answerInquiry(@Param('id') id: string, @Body() body: AnswerInquiryDto) {
    const numId = parseInt(id, 10);
    if (isNaN(numId))
      throw new BadRequestException('올바르지 않은 ID 형식입니다.');

    const inquiry = await prisma.inquiry.findUnique({ where: { id: numId } });
    if (!inquiry) {
      throw new NotFoundException('문의 내역을 찾을 수 없습니다.');
    }

    const updatedInquiry = await prisma.inquiry.update({
      where: { id: numId },
      data: {
        answer: body.answer,
        status: 'ANSWERED',
        answeredAt: new Date(),
      },
    });

    return { success: true, data: updatedInquiry };
  }

  @ApiOperation({ summary: 'Propose a refund' })
  @Post('inquiries/:id/propose-refund')
  async proposeRefund(@Param('id') id: string) {
    const numId = parseInt(id, 10);
    if (isNaN(numId))
      throw new BadRequestException('올바르지 않은 ID 형식입니다.');

    const inquiry = await prisma.inquiry.findUnique({
      where: { id: numId },
      include: { user: { include: { hon: true } } },
    });
    if (!inquiry) {
      throw new NotFoundException('문의 내역을 찾을 수 없습니다.');
    }
    if (inquiry.type !== 'REFUND') {
      throw new BadRequestException('환불 문의가 아닙니다.');
    }

    const payments = await prisma.paymentProjection.findMany({
      where: { userId: inquiry.userId, status: 'PAID' },
      orderBy: { createdAt: 'desc' },
    });

    if (payments.length === 0) {
      throw new BadRequestException(
        '환불 가능한 결제 내역이 존재하지 않습니다.',
      );
    }

    let totalChargedHon = 0;
    let totalPaymentAmount = 0;
    for (const p of payments) {
      let ch = 0;
      if (p.amount === 1000) ch = 30;
      else if (p.amount === 3000) ch = 100;
      else if (p.amount === 5000) ch = 200;
      totalChargedHon += ch;
      totalPaymentAmount += p.amount;
    }

    const currentPaid = inquiry.user.hon?.paidBalance ?? 0;

    let refundAmount = 0;
    let usedValue = 0;

    // 구독인지 판단
    const latestPayment = payments[0];
    const isSubscription =
      latestPayment.amount === 12000 || latestPayment.amount === 100000;

    if (isSubscription) {
      const paymentDate = latestPayment.createdAt;
      const now = inquiry.createdAt;
      const daysSincePayment = Math.floor(
        (now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      const isWithin7Days = daysSincePayment <= 7;

      const predictions = await prisma.prediction.findMany({
        where: {
          userId: inquiry.userId,
          createdAt: { gte: paymentDate },
        },
        include: { algorithm: true },
      });
      const personalPredictions = await prisma.personalPrediction.findMany({
        where: {
          userId: inquiry.userId,
          createdAt: { gte: paymentDate },
        },
      });

      for (const pred of predictions) {
        usedValue += (pred.algorithm?.complexity || 0) * 50;
      }
      usedValue += personalPredictions.length * 250;

      const paymentAmount = latestPayment.amount;
      const penalty = Math.floor(paymentAmount * 0.1);

      if (isWithin7Days && usedValue === 0) {
        refundAmount = paymentAmount; // 100% 환불
      } else {
        refundAmount = paymentAmount - penalty - usedValue;
      }

      refundAmount = Math.max(0, refundAmount);
    } else {
      // 기존 HON 환불 로직
      if (currentPaid > 0 && totalChargedHon > 0) {
        const remainingHon = Math.min(totalChargedHon, currentPaid);
        const usedHon = totalChargedHon - remainingHon;
        refundAmount = Math.max(
          0,
          Math.floor(totalPaymentAmount * 0.9 - usedHon * 50),
        );
      }
    }

    let answer = '';
    if (isSubscription) {
      answer = `환불 예정 금액은 ${refundAmount.toLocaleString()}원입니다. 환불하시겠습니까?\n(정기구독 환불: 위약금 및 서비스 사용 금액 ${usedValue.toLocaleString()}원 공제 반영)`;
    } else {
      answer = `환불 예정 금액은 ${refundAmount.toLocaleString()}원입니다. 환불하시겠습니까?\n(가입 이벤트로 지급된 50 HON은 보유 HON에서 제외되고 계산되며, 문의 이후 추가로 사용된 HON이 있다면 환불 금액은 달라질 수 있습니다.)`;
    }

    const updatedInquiry = await prisma.inquiry.update({
      where: { id: numId },
      data: {
        answer,
        refundStatus: 'PROPOSED',
        paymentId: payments[0].paymentId, // Keep one paymentId references for schema compatibility
      },
    });

    return { success: true, data: updatedInquiry };
  }

  @ApiOperation({ summary: 'Reject a refund' })
  @Post('inquiries/:id/reject-refund')
  async rejectRefund(@Param('id') id: string, @Body() body: RejectRefundDto) {
    const numId = parseInt(id, 10);
    if (isNaN(numId))
      throw new BadRequestException('올바르지 않은 ID 형식입니다.');

    const inquiry = await prisma.inquiry.findUnique({ where: { id: numId } });
    if (!inquiry) {
      throw new NotFoundException('문의 내역을 찾을 수 없습니다.');
    }
    if (inquiry.type !== 'REFUND') {
      throw new BadRequestException('환불 문의가 아닙니다.');
    }

    const updatedInquiry = await prisma.inquiry.update({
      where: { id: numId },
      data: {
        answer: `[환불 거절 사유]\n${body.reason}`,
        refundStatus: 'REJECTED',
        status: 'ANSWERED',
        answeredAt: new Date(),
      },
    });

    return { success: true, data: updatedInquiry };
  }

  @ApiOperation({ summary: 'Get all notices (including expired) for admin' })
  @Get('notices')
  async getAllNotices() {
    const notices = await prisma.notice.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: notices };
  }

  @ApiOperation({ summary: 'Create a new notice' })
  @Post('notices')
  async createNotice(@Body() body: CreateNoticeDto) {
    const notice = await prisma.notice.create({
      data: {
        title: body.title,
        content: body.content,
        endsAt: new Date(body.endsAt),
      },
    });

    this.appGateway.server.emit('new-notice', notice);

    return { success: true, data: notice };
  }

  @ApiOperation({ summary: 'Update an existing notice' })
  @Put('notices/:id')
  async updateNotice(@Param('id') id: string, @Body() body: UpdateNoticeDto) {
    const numId = parseInt(id, 10);
    if (isNaN(numId))
      throw new BadRequestException('올바르지 않은 ID 형식입니다.');

    const notice = await prisma.notice.findUnique({ where: { id: numId } });
    if (!notice) {
      throw new NotFoundException('공지사항을 찾을 수 없습니다.');
    }

    const updatedNotice = await prisma.notice.update({
      where: { id: numId },
      data: {
        title: body.title,
        content: body.content,
        endsAt: new Date(body.endsAt),
      },
    });

    this.appGateway.server.emit('new-notice', updatedNotice);

    return { success: true, data: updatedNotice };
  }

  @ApiOperation({ summary: 'Delete a notice' })
  @Delete('notices/:id')
  async deleteNotice(@Param('id') id: string) {
    const numId = parseInt(id, 10);
    if (isNaN(numId))
      throw new BadRequestException('올바르지 않은 ID 형식입니다.');

    const notice = await prisma.notice.findUnique({ where: { id: numId } });
    if (!notice) {
      throw new NotFoundException('공지사항을 찾을 수 없습니다.');
    }

    await prisma.notice.delete({ where: { id: numId } });
    this.appGateway.server.emit('delete-notice', { id: numId });
    return { success: true };
  }

  // Merged User Admin endpoints
  @ApiOperation({ summary: 'Get all users with pagination' })
  @Get('users')
  async getAllUsers(
    @Query('page') pageStr: string = '1',
    @Query('limit') limitStr: string = '100',
  ) {
    const page = parseInt(pageStr, 10) || 1;
    const limit = parseInt(limitStr, 10) || 100;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        include: {
          hon: true,
          subscription: true,
        },
      }),
      prisma.user.count(),
    ]);

    const enrichedUsers = await Promise.all(
      users.map(async (v) => {
        const activeBlock = await prisma.block.findFirst({
          where: {
            userId: v.id,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
        });
        return {
          ...v,
          isBlocked: !!activeBlock,
          honCount: (v.hon?.freeBalance ?? 0) + (v.hon?.paidBalance ?? 0),
          subscriptionEndsAt: v.subscription?.endsAt ?? null,
        };
      }),
    );

    return {
      success: true,
      data: enrichedUsers,
      meta: { total, page, limit },
    };
  }
  @ApiOperation({ summary: 'Get user details for admin' })
  @Get('users/:id')
  async getUserDetails(@Param('id') id: string) {
    let user = await prisma.user.findUnique({
      where: { id },
      include: {
        hon: true,
        subscription: true,
        block: true,
      },
    });

    if (!user) {
      user = await prisma.user.findFirst({
        where: { ip: id },
        include: {
          hon: true,
          subscription: true,
          block: true,
        },
      });
    }

    if (!user) {
      throw new NotFoundException('방문자를 찾을 수 없습니다.');
    }

    const activeBlock =
      user.block &&
      (!user.block.expiresAt || new Date(user.block.expiresAt) > new Date())
        ? user.block
        : null;

    return {
      id: user.id,
      ip: user.ip,
      nickname: user.nickname,
      isBlocked: !!activeBlock,
      blockDetail: activeBlock
        ? {
            description: activeBlock.description,
            expiresAt: activeBlock.expiresAt,
            createdAt: activeBlock.createdAt,
          }
        : null,
      honCount: (user.hon?.freeBalance ?? 0) + (user.hon?.paidBalance ?? 0),
      subscriptionEndsAt: user.subscription?.endsAt ?? null,
      hon: user.hon
        ? {
            freeBalance: user.hon.freeBalance,
            paidBalance: user.hon.paidBalance,
            balance: user.hon.freeBalance + user.hon.paidBalance,
          }
        : { freeBalance: 0, paidBalance: 0, balance: 0 },
      subscription: user.subscription
        ? {
            plan: user.subscription.plan,
            status: user.subscription.status,
            startsAt: user.subscription.startsAt,
            endsAt: user.subscription.endsAt,
            nextPaymentAt: user.subscription.nextPaymentAt,
          }
        : null,
    };
  }

  @ApiOperation({ summary: 'Block user' })
  @Post('users/:id/block')
  async blockUser(@Param('id') id: string, @Body() body: BlockUserDto) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('방문자를 찾을 수 없습니다.');
    }

    const expiresAt =
      body.period && body.period > 0
        ? new Date(Date.now() + body.period * 60 * 60 * 1000)
        : null;

    await prisma.block.upsert({
      where: { userId: id },
      create: {
        userId: id,
        description: body.description,
        period: body.period,
        expiresAt,
      },
      update: {
        description: body.description,
        period: body.period,
        expiresAt,
        createdAt: new Date(),
      },
    });

    await this.redisService.set(`user-blocked:${id}`, 'true', 86400 * 7);

    return { success: true };
  }

  @ApiOperation({ summary: 'Unblock user' })
  @Post('users/:id/unblock')
  async unblockUser(@Param('id') id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('방문자를 찾을 수 없습니다.');
    }

    await prisma.block.deleteMany({
      where: { userId: id },
    });

    await this.redisService.set(`user-blocked:${id}`, 'false', 86400 * 7);

    return { success: true };
  }

  @ApiOperation({ summary: 'Reset user nickname' })
  @Post('users/:id/reset-nickname')
  async resetUserNickname(@Param('id') id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('방문자를 찾을 수 없습니다.');
    }

    await prisma.user.update({
      where: { id },
      data: { nickname: null },
    });

    return { success: true };
  }

  @ApiOperation({ summary: 'Add or deduct Hon for user' })
  @Post('users/:id/hon')
  async manageHon(@Param('id') id: string, @Body() body: ManageHonDto) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('방문자를 찾을 수 없습니다.');
    }

    await this.honService.provisionHonByAdmin(id, body.amount);
    return { success: true };
  }

  @ApiOperation({ summary: 'Grant free pass subscription' })
  @Post('users/:id/subscription/unlimited')
  async grantUnlimitedPass(
    @Param('id') id: string,
    @Body() body: GrantSubscriptionDto,
  ) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('방문자를 찾을 수 없습니다.');
    }

    await this.honService.provisionUnlimitedSubscriptionByAdmin(
      id,
      new Date(body.endsAt),
    );
    return { success: true };
  }

  @ApiOperation({ summary: 'Get manager dashboard stats' })
  @Get('stats')
  async getDashboardStats() {
    const totalUsers = await prisma.user.count();
    return { totalUsers };
  }

  @ApiOperation({ summary: 'Bulk add or deduct Hon for all users' })
  @Post('users/bulk-hon')
  async manageBulkHon(@Body() body: ManageHonDto) {
    await this.honService.bulkProvisionHonByAdmin(body.amount);
    return { success: true };
  }

  @ApiOperation({ summary: 'Get user predictions for admin' })
  @Get('users/:id/predictions')
  async getUserPredictions(@Param('id') id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('방문자를 찾을 수 없습니다.');
    }

    const predictions = await prisma.personalPrediction.findMany({
      where: { userId: id },
      orderBy: { id: 'desc' },
      include: {
        winningNumber: true,
      },
    });

    return { success: true, data: predictions };
  }

  @ApiOperation({ summary: 'Get all reported posts for admin' })
  @Get('reports')
  async getReports() {
    const reports = await prisma.postReport.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        post: true,
      },
    });
    return { success: true, data: reports };
  }

  @ApiOperation({ summary: 'Answer/Resolve a post report' })
  @Post('reports/:id/answer')
  async resolveReport(@Param('id') id: string, @Body() body: AnswerReportDto) {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      throw new BadRequestException('올바르지 않은 ID 형식입니다.');
    }

    const report = await prisma.postReport.findUnique({ where: { id: numId } });
    if (!report) {
      throw new NotFoundException('신고 내역을 찾을 수 없습니다.');
    }

    const updated = await prisma.postReport.update({
      where: { id: numId },
      data: {
        answer: body.answer,
        status: 'RESOLVED',
        answeredAt: new Date(),
      },
    });

    return { success: true, data: updated };
  }

  @ApiOperation({ summary: 'Delete a reported post by admin' })
  @Delete('posts/:id')
  async deleteReportedPost(@Param('id') id: string) {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      throw new BadRequestException('올바르지 않은 ID 형식입니다.');
    }

    const post = await prisma.post.findUnique({ where: { id: numId } });
    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    await prisma.post.delete({ where: { id: numId } });
    return { success: true };
  }

  @ApiOperation({ summary: 'Get all nickname reports' })
  @Get('nickname-reports')
  async getNicknameReports() {
    const reports = await prisma.nicknameReport.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: reports };
  }

  @ApiOperation({ summary: 'Block a reported nickname' })
  @Post('nickname-reports/:id/block')
  async blockNicknameReport(@Param('id') id: string) {
    const report = await prisma.nicknameReport.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Report not found');
    if (report.status !== 'PENDING')
      throw new BadRequestException('Report already processed');

    // Add to banned words
    await this.badWordsService.addBannedWord(report.targetNickname);

    // Update report status
    await prisma.nicknameReport.update({
      where: { id },
      data: { status: 'BLOCKED' },
    });

    // Reset nickname of the offender
    await prisma.user.updateMany({
      where: { nickname: report.targetNickname },
      data: { nickname: null },
    });

    // Automatically block all pending reports for this nickname
    await prisma.nicknameReport.updateMany({
      where: { targetNickname: report.targetNickname, status: 'PENDING' },
      data: { status: 'BLOCKED' },
    });

    return { success: true };
  }

  @ApiOperation({ summary: 'Reject a nickname report' })
  @Post('nickname-reports/:id/reject')
  async rejectNicknameReport(@Param('id') id: string) {
    const report = await prisma.nicknameReport.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Report not found');
    if (report.status !== 'PENDING')
      throw new BadRequestException('Report already processed');

    await prisma.nicknameReport.update({
      where: { id },
      data: { status: 'REJECTED' },
    });

    return { success: true };
  }

  @ApiOperation({ summary: 'Get all banned words' })
  @Get('banned-words')
  async getBannedWords() {
    const words = this.badWordsService.getAllBannedWords();
    return { success: true, data: words };
  }

  @ApiOperation({ summary: 'Add a banned word manually' })
  @Post('banned-words')
  async addBannedWord(@Body('word') word: string) {
    if (!word) throw new BadRequestException('Word is required');
    await this.badWordsService.addBannedWord(word);
    return { success: true };
  }

  @ApiOperation({ summary: 'Remove a banned word manually' })
  @Delete('banned-words/:word')
  async removeBannedWord(@Param('word') word: string) {
    if (!word) throw new BadRequestException('Word is required');
    await this.badWordsService.removeBannedWord(word);
    return { success: true };
  }

  @ApiOperation({ summary: 'Update post status (soft delete/block)' })
  @Patch('posts/:id')
  async updatePostStatus(
    @Param('id') id: string,
    @Body('isDeleted') isDeleted?: boolean,
    @Body('isBlocked') isBlocked?: boolean,
  ) {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) throw new BadRequestException('Invalid ID');

    const data: any = {};
    if (isDeleted !== undefined) data.isDeleted = isDeleted;
    if (isBlocked !== undefined) data.isBlocked = isBlocked;

    const post = await prisma.post.update({
      where: { id: numId },
      data,
    });
    return { success: true, data: post };
  }

  @ApiOperation({ summary: 'Update comment status (block)' })
  @Patch('comments/:id')
  async updateCommentStatus(
    @Param('id') id: string,
    @Body('isBlocked') isBlocked: boolean,
  ) {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) throw new BadRequestException('Invalid ID');

    const comment = await prisma.postComment.update({
      where: { id: numId },
      data: { isBlocked },
    });
    return { success: true, data: comment };
  }

  @ApiOperation({ summary: 'Delete a post (hard delete for admin)' })
  @Delete('posts/:id')
  async deletePostAdmin(@Param('id') id: string) {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) throw new BadRequestException('Invalid ID');

    await prisma.post.delete({
      where: { id: numId },
    });
    return { success: true };
  }

  // ==========================================
  // 관리자 HON 자동 지급/초기화 이벤트 설정 API
  // ==========================================

  @ApiOperation({ summary: '관리자 HON 이벤트 설정 생성' })
  @Post('hon-events')
  async createHonEventSetting(@Body() dto: CreateAdminHonEventDto) {
    const event = await prisma.adminHonEventSetting.create({
      data: {
        type: dto.type,
        amount: dto.amount,
        startsAt: new Date(dto.startsAt),
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        isActive: dto.isActive ?? true,
      },
    });
    return { success: true, data: event };
  }

  @ApiOperation({ summary: '관리자 HON 이벤트 설정 목록 조회' })
  @Get('hon-events')
  async getHonEventSettings() {
    const events = await prisma.adminHonEventSetting.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: events };
  }

  @ApiOperation({ summary: '관리자 HON 이벤트 수동 종료 (비활성화)' })
  @Patch('hon-events/:id/terminate')
  async terminateHonEventSetting(@Param('id') id: string) {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) throw new BadRequestException('Invalid ID');

    const event = await prisma.adminHonEventSetting.update({
      where: { id: numId },
      data: { isActive: false },
    });
    return { success: true, data: event };
  }

  @ApiOperation({ summary: '관리자 HON 이벤트 설정 삭제' })
  @Delete('hon-events/:id')
  async deleteHonEventSetting(@Param('id') id: string) {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) throw new BadRequestException('Invalid ID');

    await prisma.adminHonEventSetting.delete({
      where: { id: numId },
    });
    return { success: true };
  }

  @ApiOperation({ summary: 'Send a notification to a specific user' })
  @Post('notifications')
  async sendNotification(@Body() body: SendNotificationDto) {
    const { targetType, target, title, content } = body;
    let userId = '';

    if (targetType === 'NICKNAME') {
      const user = await prisma.user.findUnique({
        where: { nickname: target },
      });
      if (!user) {
        throw new NotFoundException(
          '해당 닉네임을 가진 사용자를 찾을 수 없습니다.',
        );
      }
      userId = user.id;
    } else {
      const user = await prisma.user.findUnique({
        where: { id: target },
      });
      if (!user) {
        throw new NotFoundException(
          '해당 ID를 가진 사용자를 찾을 수 없습니다.',
        );
      }
      userId = user.id;
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        content,
      },
    });

    this.appGateway.sendToUser(userId, 'new-notification', notification);

    return { success: true, data: notification };
  }
}
