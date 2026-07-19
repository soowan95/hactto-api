import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as crypto from 'crypto';
import {
  BadRequestException,
  Controller,
  Inject,
  Post,
  Get,
  Body,
  Param,
  Query,
  NotFoundException,
  Patch,
} from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from '../domain/ports/user.port';
import { RedisService } from '../../../helpers/redis/application/redis.service';
import { RequestParser } from '../../../common/utils/request-parser';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { HonService } from '../application/hon.service';
import { PaymentService } from '../application/payment.service';
import { BadWordsService } from '../application/bad-words.service';
import { prisma } from '../../../libs/prisma';
import { InquiryType } from '../../../generated/prisma/enums';
import { CreateInquiryDto } from './dtos/requests/create-inquiry-request.dto';

@ApiTags('- User')
@Controller('user')
export class UserController {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
    private readonly redisService: RedisService,
    private readonly honService: HonService,
    private readonly paymentService: PaymentService,
    private readonly requestParser: RequestParser,
    private readonly badWordsService: BadWordsService,
  ) {}

  @ApiOperation({ summary: 'Register user' })
  @ResponseMessage('success.register.user')
  @Post('register')
  async register(): Promise<void> {
    const ip = this.requestParser.getIpOrThrow();
    const userId = this.requestParser.getUserId();

    if (!userId) {
      throw new BadRequestException('User ID가 유효하지 않습니다.');
    }

    const redisKey = `user-ip:${userId}`;
    await this.redisService.set(redisKey, ip, 604800); // 7 days expiration
    await this.userRepository.insert(userId, ip);
    await this.honService.chargeHon(
      `${userId}-register`,
      userId,
      50,
      true,
      '첫 방문',
    );
  }

  @ApiOperation({ summary: 'Get current user profile' })
  @Get('me')
  async getMe() {
    const userId = this.requestParser.getUserId();
    if (!userId) throw new BadRequestException('User ID가 유효하지 않습니다.');
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('방문자를 찾을 수 없습니다.');
    return { success: true, data: user };
  }

  @ApiOperation({ summary: 'Check if nickname exists' })
  @Get('check-nickname')
  async checkNickname(@Query('nickname') nickname: string) {
    if (!nickname) throw new BadRequestException('Nickname is required.');
    if (this.badWordsService.containsBadWord(nickname)) {
      throw new BadRequestException('사용할 수 없는 단어가 포함되어 있습니다.');
    }
    if (nickname.includes('관리자')) {
      return { success: true, exists: true };
    }
    const user = await prisma.user.findUnique({ where: { nickname } });
    return { success: true, exists: !!user };
  }

  @ApiOperation({ summary: 'Set nickname (only once)' })
  @Post('nickname')
  async setNickname(@Body('nickname') nickname: string) {
    const userId = this.requestParser.getUserId();
    if (!userId) throw new BadRequestException('User ID가 유효하지 않습니다.');
    if (!nickname || nickname.length > 30)
      throw new BadRequestException('유효하지 않은 닉네임입니다.');
    if (this.badWordsService.containsBadWord(nickname))
      throw new BadRequestException('사용할 수 없는 단어가 포함되어 있습니다.');
    if (nickname.includes('관리자'))
      throw new BadRequestException(
        '관리자가 포함된 닉네임은 사용할 수 없습니다.',
      );

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('방문자를 찾을 수 없습니다.');
    if (user.nickname)
      throw new BadRequestException('이미 닉네임이 설정되어 있습니다.');

    const existing = await prisma.user.findUnique({ where: { nickname } });
    if (existing) throw new BadRequestException('이미 사용 중인 닉네임입니다.');

    await prisma.user.update({
      where: { id: userId },
      data: { nickname },
    });

    return { success: true };
  }
  @ApiOperation({ summary: 'Submit an inquiry' })
  @Post('inquiries')
  async createInquiry(@Body() body: CreateInquiryDto) {
    const userId = this.requestParser.getUserId();
    if (!userId) {
      throw new BadRequestException('방문자 ID가 존재하지 않습니다.');
    }

    // Check duplicate pending inquiry of the same type (BLOCK or REFUND)
    if (body.type === InquiryType.BLOCK || body.type === InquiryType.REFUND) {
      const existing = await prisma.inquiry.findFirst({
        where: {
          userId,
          type: body.type,
          OR: [{ status: 'PENDING' }, { refundStatus: 'PROPOSED' }],
        },
      });
      if (existing) {
        throw new BadRequestException(
          '이미 처리 중이거나 답변 확인 대기 중인 문의가 존재합니다.',
        );
      }
    }

    // Ensure user exists
    let user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      let ip = '0.0.0.0';
      try {
        ip = this.requestParser.getIpOrThrow();
      } catch {}
      user = await prisma.user.create({
        data: { id: userId, ip },
      });
      await prisma.hon.create({
        data: { userId, freeBalance: 50, paidBalance: 0 },
      });
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        userId,
        title: body.title,
        content: body.content,
        type: body.type,
        paymentId: body.paymentId,
        refundStatus: body.type === InquiryType.REFUND ? 'PENDING' : 'NONE',
        isForBlock: body.type === InquiryType.BLOCK, // compatibility
      },
    });

    return { success: true, data: inquiry };
  }

  @ApiOperation({ summary: 'Get user inquiries' })
  @Get('inquiries')
  async getInquiries(@Query('type') type?: string) {
    const userId = this.requestParser.getUserId();
    if (!userId) {
      throw new BadRequestException('방문자 ID가 존재하지 않습니다.');
    }

    const where: any = { userId };
    if (type && type !== 'ALL') {
      where.type = type;
    }

    const inquiries = await prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: inquiries };
  }

  @ApiOperation({ summary: 'Get active notices' })
  @Get('notices')
  async getActiveNotices() {
    const now = new Date();
    const notices = await prisma.notice.findMany({
      where: {
        endsAt: {
          gt: now,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: notices };
  }

  @ApiOperation({ summary: 'Confirm and execute refund' })
  @Post('inquiries/:id/confirm-refund')
  async confirmRefund(@Param('id') id: string) {
    const numId = parseInt(id, 10);
    if (isNaN(numId))
      throw new BadRequestException('올바르지 않은 ID 형식입니다.');
    const userId = this.requestParser.getUserId();
    if (!userId) {
      throw new BadRequestException('방문자 ID가 존재하지 않습니다.');
    }

    const inquiry = await prisma.inquiry.findFirst({
      where: { id: numId, userId },
      include: { user: { include: { hon: true } } },
    });
    if (!inquiry) {
      throw new NotFoundException('문의 내역을 찾을 수 없습니다.');
    }
    if (inquiry.type !== InquiryType.REFUND) {
      throw new BadRequestException('환불 문의가 아닙니다.');
    }
    if (inquiry.refundStatus !== 'PROPOSED') {
      throw new BadRequestException('최종 승인 대기 상태가 아닙니다.');
    }
    if (!inquiry.paymentId) {
      throw new BadRequestException('연동된 결제 내역이 없습니다.');
    }

    // Fetch all successful payments for this user
    const payments = await prisma.paymentProjection.findMany({
      where: { userId, status: 'PAID' },
      orderBy: { createdAt: 'desc' },
    });

    if (payments.length === 0) {
      throw new BadRequestException(
        '환불 가능한 결제 내역이 존재하지 않습니다.',
      );
    }

    // Recalculate amount across all payments
    let totalChargedHon = 0;
    let totalPaymentAmount = 0;
    const paymentRefundLimits = payments.map((p) => {
      let ch = 0;
      if (p.amount === 1000) ch = 30;
      else if (p.amount === 3000) ch = 100;
      else if (p.amount === 5000) ch = 200;
      totalChargedHon += ch;
      totalPaymentAmount += p.amount;
      return { payment: p, chargedHon: ch, refundableLimit: p.amount };
    });

    const currentPaidBalance = inquiry.user.hon?.paidBalance ?? 0;
    let totalRefundAmount = 0;
    let remainingHon = 0;

    if (currentPaidBalance > 0 && totalChargedHon > 0) {
      remainingHon = Math.min(totalChargedHon, currentPaidBalance);
      const usedHon = totalChargedHon - remainingHon;
      totalRefundAmount = Math.max(
        0,
        Math.floor(totalPaymentAmount * 0.9 - usedHon * 50),
      );
    }

    // Execute multi-payment LIFO cancels
    let pendingRefundAmount = totalRefundAmount;
    const cancelReason = `사용자 환불 최종 수락 (총 환불 금액: ${totalRefundAmount}원)`;

    for (const limitInfo of paymentRefundLimits) {
      if (pendingRefundAmount <= 0) break;

      const cancelAmount = Math.min(
        pendingRefundAmount,
        limitInfo.refundableLimit,
      );
      if (cancelAmount > 0) {
        await this.paymentService.cancelPayment(
          limitInfo.payment.paymentId,
          cancelReason,
          cancelAmount,
        );
        pendingRefundAmount -= cancelAmount;
      }
    }

    // Deduct remaining charged HON
    if (remainingHon > 0) {
      await this.honService.deductHon(
        userId,
        remainingHon,
        '환불 처리로 인한 회수',
        true,
      );
    }

    // Update inquiry
    const updatedInquiry = await prisma.inquiry.update({
      where: { id: numId },
      data: {
        refundStatus: 'CONFIRMED',
        status: 'ANSWERED',
        answeredAt: new Date(),
        answer:
          inquiry.answer +
          `\n\n[환불 완료]\n${new Date().toLocaleString()}에 ${totalRefundAmount.toLocaleString()}원 환불 처리가 성공적으로 완료되었습니다.`,
      },
    });

    return { success: true, data: updatedInquiry };
  }

  @ApiOperation({ summary: 'Cancel refund inquiry' })
  @Post('inquiries/:id/cancel-refund')
  async cancelRefund(@Param('id') id: string) {
    const numId = parseInt(id, 10);
    if (isNaN(numId))
      throw new BadRequestException('올바르지 않은 ID 형식입니다.');
    const userId = this.requestParser.getUserId();
    if (!userId) {
      throw new BadRequestException('방문자 ID가 존재하지 않습니다.');
    }

    const inquiry = await prisma.inquiry.findFirst({
      where: { id: numId, userId },
    });
    if (!inquiry) {
      throw new NotFoundException('문의 내역을 찾을 수 없습니다.');
    }
    if (inquiry.type !== InquiryType.REFUND) {
      throw new BadRequestException('환불 문의가 아닙니다.');
    }
    if (inquiry.status !== 'PENDING' && inquiry.refundStatus !== 'PROPOSED') {
      throw new BadRequestException('취소 가능한 상태가 아닙니다.');
    }

    const updatedInquiry = await prisma.inquiry.update({
      where: { id: numId },
      data: {
        refundStatus: 'CANCELLED',
        status: 'ANSWERED',
        answeredAt: new Date(),
        answer:
          (inquiry.answer ? inquiry.answer + '\n\n' : '') +
          `[문의 취소]\n사용자가 환불 요청을 취소하였습니다.`,
      },
    });

    return { success: true, data: updatedInquiry };
  }

  @ApiOperation({ summary: 'Get user hon events' })
  @Get('hon-events')
  async getHonEvents() {
    const userId = this.requestParser.getUserId();
    if (!userId) {
      throw new BadRequestException('방문자 ID가 존재하지 않습니다.');
    }

    const events = await this.honService.getHonEvents(userId);
    return { success: true, data: events };
  }

  @ApiOperation({ summary: 'Report a nickname' })
  @Post('nickname-report')
  async reportNickname(
    @Body('targetNickname') targetNickname: string,
    @Body('reason') reason?: string,
  ) {
    const reporterId = this.requestParser.getUserId();
    if (!reporterId) throw new BadRequestException('User ID is required.');
    if (!targetNickname)
      throw new BadRequestException('Target nickname is required.');

    const targetUser = await prisma.user.findUnique({
      where: { nickname: targetNickname },
    });
    if (!targetUser)
      throw new NotFoundException('해당 닉네임을 찾을 수 없습니다.');

    await prisma.nicknameReport.create({
      data: {
        targetNickname,
        reporterId,
        reason: reason || null,
      },
    });

    return { success: true };
  }
  @ApiOperation({ summary: 'Get user notifications' })
  @Get('notifications')
  async getNotifications() {
    const userId = this.requestParser.getUserId();
    if (!userId) throw new BadRequestException('User ID is required.');

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: notifications };
  }

  @ApiOperation({ summary: 'Get unread notification count' })
  @Get('notifications/unread-count')
  async getUnreadNotificationCount() {
    const userId = this.requestParser.getUserId();
    if (!userId) throw new BadRequestException('User ID is required.');

    const count = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    return { success: true, data: { count } };
  }

  @ApiOperation({ summary: 'Mark notification as read' })
  @Patch('notifications/:id/read')
  async markNotificationAsRead(@Param('id') id: string) {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) throw new BadRequestException('Invalid ID');

    const userId = this.requestParser.getUserId();
    if (!userId) throw new BadRequestException('User ID is required.');

    const notification = await prisma.notification.findFirst({
      where: { id: numId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    const updated = await prisma.notification.update({
      where: { id: numId },
      data: { isRead: true },
    });

    return { success: true, data: updated };
  }
  @ApiOperation({ summary: 'Get user profile' })
  @Get('profile/:userId')
  async getUserProfile(@Param('userId') targetUserId: string) {
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { nickname: true, avatarUrl: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const winningPosts = await prisma.post.findMany({
      where: {
        userId: targetUserId,
        lottoRank: { not: null, lte: 5 },
        isDeleted: false,
        isBlocked: false,
      },
      select: { lottoRank: true },
    });

    const winningStats = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    winningPosts.forEach((post) => {
      if (post.lottoRank && post.lottoRank >= 1 && post.lottoRank <= 5) {
        winningStats[post.lottoRank]++;
      }
    });

    return {
      success: true,
      data: {
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        winningStats,
      },
    };
  }

  @ApiOperation({ summary: 'Get presigned URL for avatar upload' })
  @Post('avatar/presigned-url')
  async getAvatarPresignedUrl(
    @Body('mimeType') mimeType: string,
    @Body('extension') extension: string,
  ) {
    const userId = this.requestParser.getUserId();
    if (!userId) {
      throw new BadRequestException('User ID가 유효하지 않습니다.');
    }

    if (!mimeType.startsWith('image/')) {
      throw new BadRequestException('이미지 파일만 업로드할 수 있습니다.');
    }

    const s3Bucket = process.env.AWS_S3_BUCKET || 'hactto-board-attachments';
    const region = process.env.AWS_REGION || 'ap-northeast-2';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('S3 credentials not configured');
    }

    const s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const uniqueId = crypto.randomUUID();
    const key = `avatars/${userId}/${uniqueId}.${extension.replace('.', '')}`;
    const command = new PutObjectCommand({
      Bucket: s3Bucket,
      Key: key,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
    const imageUrl = `https://${s3Bucket}.s3.${region}.amazonaws.com/${key}`;

    return {
      success: true,
      data: {
        uploadUrl,
        imageUrl,
      },
    };
  }

  @ApiOperation({ summary: 'Update avatar URL' })
  @Patch('avatar')
  async updateAvatar(@Body('avatarUrl') avatarUrl: string) {
    const userId = this.requestParser.getUserId();
    if (!userId) {
      throw new BadRequestException('User ID가 유효하지 않습니다.');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    return { success: true };
  }
}
