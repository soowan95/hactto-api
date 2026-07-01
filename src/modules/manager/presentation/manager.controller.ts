import {
  Controller,
  Post,
  Get,
  Put,
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
  BlockVisitorDto,
} from './dtos/requests/visitor-requests.dto';
import {
  IVisitorRepository,
  VISITOR_REPOSITORY_TOKEN,
} from '../../user/domain/ports/visitor.port';
import { HonService } from '../../user/application/hon.service';
import { RedisService } from '../../../helpers/redis/application/redis.service';
import { BadWordsService } from '../../user/application/bad-words.service';

@ApiTags('- Admin Manager')
@Admin()
@Controller('manager')
export class ManagerController {
  constructor(
    @Inject(VISITOR_REPOSITORY_TOKEN)
    private readonly visitorRepository: IVisitorRepository,
    private readonly honService: HonService,
    private readonly redisService: RedisService,
    private readonly badWordsService: BadWordsService,
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
        visitor: {
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
            where: { visitorId: inq.visitorId, status: 'PAID' },
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

            const currentFree = inq.visitor.hon?.freeBalance ?? 0;
            const currentPaid = inq.visitor.hon?.paidBalance ?? 0;
            const totalBalance = currentFree + currentPaid;
            let refundAmount = 0;

            if (currentPaid > 0 && totalChargedHon > 0) {
              const remainingHon = Math.min(totalChargedHon, currentPaid);
              const usedHon = totalChargedHon - remainingHon;
              refundAmount = Math.max(
                0,
                Math.floor(totalPaymentAmount * 0.9 - usedHon * 50),
              );
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
      include: { visitor: { include: { hon: true } } },
    });
    if (!inquiry) {
      throw new NotFoundException('문의 내역을 찾을 수 없습니다.');
    }
    if (inquiry.type !== 'REFUND') {
      throw new BadRequestException('환불 문의가 아닙니다.');
    }

    const payments = await prisma.paymentProjection.findMany({
      where: { visitorId: inquiry.visitorId, status: 'PAID' },
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

    const currentPaid = inquiry.visitor.hon?.paidBalance ?? 0;
    let refundAmount = 0;

    if (currentPaid > 0 && totalChargedHon > 0) {
      const remainingHon = Math.min(totalChargedHon, currentPaid);
      const usedHon = totalChargedHon - remainingHon;
      refundAmount = Math.max(
        0,
        Math.floor(totalPaymentAmount * 0.9 - usedHon * 50),
      );
    }

    const answer = `환불 예정 금액은 ${refundAmount.toLocaleString()}원입니다. 환불하시겠습니까?\n(가입 이벤트로 지급된 50 HON은 보유 HON에서 제외되고 계산되며, 문의 이후 추가로 사용된 HON이 있다면 환불 금액은 달라질 수 있습니다.)`;

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
    return { success: true };
  }

  // Merged Visitor Admin endpoints
  @ApiOperation({ summary: 'Get all visitors with pagination' })
  @Get('visitors')
  async getAllVisitors(
    @Query('page') pageStr: string = '1',
    @Query('limit') limitStr: string = '100',
  ) {
    const page = parseInt(pageStr, 10) || 1;
    const limit = parseInt(limitStr, 10) || 100;
    const skip = (page - 1) * limit;

    const [visitors, total] = await Promise.all([
      prisma.visitor.findMany({
        skip,
        take: limit,
        include: {
          hon: true,
          subscription: true,
        },
      }),
      prisma.visitor.count(),
    ]);

    const enrichedVisitors = await Promise.all(
      visitors.map(async (v) => {
        const activeBlock = await prisma.block.findFirst({
          where: {
            visitorId: v.id,
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
      data: enrichedVisitors,
      meta: { total, page, limit },
    };
  }
  @ApiOperation({ summary: 'Get visitor details for admin' })
  @Get('visitors/:id')
  async getVisitorDetails(@Param('id') id: string) {
    let visitor = await prisma.visitor.findUnique({
      where: { id },
      include: {
        hon: true,
        subscription: true,
        block: true,
      },
    });

    if (!visitor) {
      visitor = await prisma.visitor.findFirst({
        where: { ip: id },
        include: {
          hon: true,
          subscription: true,
          block: true,
        },
      });
    }

    if (!visitor) {
      throw new NotFoundException('방문자를 찾을 수 없습니다.');
    }

    const activeBlock =
      visitor.block &&
      (!visitor.block.expiresAt ||
        new Date(visitor.block.expiresAt) > new Date())
        ? visitor.block
        : null;

    return {
      id: visitor.id,
      ip: visitor.ip,
      isBlocked: !!activeBlock,
      blockDetail: activeBlock
        ? {
            description: activeBlock.description,
            expiresAt: activeBlock.expiresAt,
            createdAt: activeBlock.createdAt,
          }
        : null,
      honCount:
        (visitor.hon?.freeBalance ?? 0) + (visitor.hon?.paidBalance ?? 0),
      subscriptionEndsAt: visitor.subscription?.endsAt ?? null,
      hon: visitor.hon
        ? {
            freeBalance: visitor.hon.freeBalance,
            paidBalance: visitor.hon.paidBalance,
            balance: visitor.hon.freeBalance + visitor.hon.paidBalance,
          }
        : { freeBalance: 0, paidBalance: 0, balance: 0 },
      subscription: visitor.subscription
        ? {
            plan: visitor.subscription.plan,
            status: visitor.subscription.status,
            startsAt: visitor.subscription.startsAt,
            endsAt: visitor.subscription.endsAt,
            nextPaymentAt: visitor.subscription.nextPaymentAt,
          }
        : null,
    };
  }

  @ApiOperation({ summary: 'Block visitor' })
  @Post('visitors/:id/block')
  async blockVisitor(@Param('id') id: string, @Body() body: BlockVisitorDto) {
    const visitor = await prisma.visitor.findUnique({ where: { id } });
    if (!visitor) {
      throw new NotFoundException('방문자를 찾을 수 없습니다.');
    }

    const expiresAt =
      body.period && body.period > 0
        ? new Date(Date.now() + body.period * 60 * 60 * 1000)
        : null;

    await prisma.block.upsert({
      where: { visitorId: id },
      create: {
        visitorId: id,
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

    await this.redisService.set(`visitor-blocked:${id}`, 'true', 86400 * 7);

    return { success: true };
  }

  @ApiOperation({ summary: 'Unblock visitor' })
  @Post('visitors/:id/unblock')
  async unblockVisitor(@Param('id') id: string) {
    const visitor = await prisma.visitor.findUnique({ where: { id } });
    if (!visitor) {
      throw new NotFoundException('방문자를 찾을 수 없습니다.');
    }

    await prisma.block.deleteMany({
      where: { visitorId: id },
    });

    await this.redisService.set(`visitor-blocked:${id}`, 'false', 86400 * 7);

    return { success: true };
  }

  @ApiOperation({ summary: 'Add or deduct Hon for visitor' })
  @Post('visitors/:id/hon')
  async manageHon(@Param('id') id: string, @Body() body: ManageHonDto) {
    const visitor = await prisma.visitor.findUnique({ where: { id } });
    if (!visitor) {
      throw new NotFoundException('방문자를 찾을 수 없습니다.');
    }

    await this.honService.provisionHonByAdmin(id, body.amount);
    return { success: true };
  }

  @ApiOperation({ summary: 'Grant free pass subscription' })
  @Post('visitors/:id/subscription/unlimited')
  async grantUnlimitedPass(
    @Param('id') id: string,
    @Body() body: GrantSubscriptionDto,
  ) {
    const visitor = await prisma.visitor.findUnique({ where: { id } });
    if (!visitor) {
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
    const totalUsers = await prisma.visitor.count();
    return { totalUsers };
  }

  @ApiOperation({ summary: 'Bulk add or deduct Hon for all visitors' })
  @Post('visitors/bulk-hon')
  async manageBulkHon(@Body() body: ManageHonDto) {
    await this.honService.bulkProvisionHonByAdmin(body.amount);
    return { success: true };
  }

  @ApiOperation({ summary: 'Get visitor predictions for admin' })
  @Get('visitors/:id/predictions')
  async getVisitorPredictions(@Param('id') id: string) {
    const visitor = await prisma.visitor.findUnique({ where: { id } });
    if (!visitor) {
      throw new NotFoundException('방문자를 찾을 수 없습니다.');
    }

    const predictions = await prisma.personalPrediction.findMany({
      where: { visitorId: id },
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
    await prisma.visitor.updateMany({
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
}
