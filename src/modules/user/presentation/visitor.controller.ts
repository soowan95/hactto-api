import { ApiOperation, ApiTags } from '@nestjs/swagger';
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
} from '@nestjs/common';
import {
  IVisitorRepository,
  VISITOR_REPOSITORY_TOKEN,
} from '../domain/ports/visitor.port';
import { RedisService } from '../../../helpers/redis/application/redis.service';
import { RequestParser } from '../../../common/utils/request-parser';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { HonService } from '../application/hon.service';
import { PaymentService } from '../application/payment.service';
import { prisma } from '../../../libs/prisma';
import { InquiryType } from '../../../generated/prisma/enums';
import { CreateInquiryDto } from './dtos/requests/create-inquiry-request.dto';

@ApiTags('- Visitor')
@Controller('visitor')
export class VisitorController {
  constructor(
    @Inject(VISITOR_REPOSITORY_TOKEN)
    private readonly visitorRepository: IVisitorRepository,
    private readonly redisService: RedisService,
    private readonly honService: HonService,
    private readonly paymentService: PaymentService,
    private readonly requestParser: RequestParser,
  ) {}

  @ApiOperation({ summary: 'Register visitor' })
  @ResponseMessage('success.register.visitor')
  @Post('register')
  async register(): Promise<void> {
    const ip = this.requestParser.getIpOrThrow();
    const visitorId = this.requestParser.getVisitorId();

    if (!visitorId) {
      throw new BadRequestException('Visitor ID가 유효하지 않습니다.');
    }

    const redisKey = `visitor-ip:${visitorId}`;
    await this.redisService.set(redisKey, ip, 604800); // 7 days expiration
    await this.visitorRepository.insert(visitorId, ip);
    await this.honService.chargeHon(
      `${visitorId}-register`,
      visitorId,
      50,
      '첫 방문',
    );
  }

  @ApiOperation({ summary: 'Submit an inquiry' })
  @Post('inquiries')
  async createInquiry(@Body() body: CreateInquiryDto) {
    const visitorId = this.requestParser.getVisitorId();
    if (!visitorId) {
      throw new BadRequestException('방문자 ID가 존재하지 않습니다.');
    }

    // Check duplicate pending inquiry of the same type (BLOCK or REFUND)
    if (body.type === InquiryType.BLOCK || body.type === InquiryType.REFUND) {
      const existing = await prisma.inquiry.findFirst({
        where: {
          visitorId,
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

    // Ensure visitor exists
    let visitor = await prisma.visitor.findUnique({
      where: { id: visitorId },
    });
    if (!visitor) {
      let ip = '0.0.0.0';
      try {
        ip = this.requestParser.getIpOrThrow();
      } catch {}
      visitor = await prisma.visitor.create({
        data: { id: visitorId, ip },
      });
      await prisma.hon.create({
        data: { visitorId, balance: 50 },
      });
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        visitorId,
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

  @ApiOperation({ summary: 'Get visitor inquiries' })
  @Get('inquiries')
  async getInquiries(@Query('type') type?: string) {
    const visitorId = this.requestParser.getVisitorId();
    if (!visitorId) {
      throw new BadRequestException('방문자 ID가 존재하지 않습니다.');
    }

    const where: any = { visitorId };
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
    const visitorId = this.requestParser.getVisitorId();
    if (!visitorId) {
      throw new BadRequestException('방문자 ID가 존재하지 않습니다.');
    }

    const inquiry = await prisma.inquiry.findFirst({
      where: { id: numId, visitorId },
      include: { visitor: { include: { hon: true } } },
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

    // Fetch payment projection
    const payment = await prisma.paymentProjection.findUnique({
      where: { paymentId: inquiry.paymentId },
    });
    if (!payment || payment.status !== 'PAID') {
      throw new BadRequestException('환불 가능한 상태의 결제 건이 아닙니다.');
    }

    // Recalculate amount
    let chargedHon = 0;
    if (payment.amount === 1000) chargedHon = 30;
    else if (payment.amount === 3000) chargedHon = 100;
    else if (payment.amount === 5000) chargedHon = 200;

    const currentBalance = inquiry.visitor.hon?.balance ?? 0;
    let refundAmount = 0;
    let remainingHon = 0;

    if (currentBalance > 50 && chargedHon > 0) {
      const refundBalance = currentBalance - 50;
      remainingHon = Math.min(chargedHon, refundBalance);
      const usedHon = chargedHon - remainingHon;
      refundAmount = Math.max(
        0,
        Math.floor(payment.amount * 0.9 - usedHon * 50),
      );
    }

    // Execute actual PG cancel
    const cancelReason = `사용자 환불 최종 수락 (환불 금액: ${refundAmount}원)`;
    await this.paymentService.cancelPayment(payment.paymentId, cancelReason);

    // Deduct remaining charged HON
    if (remainingHon > 0) {
      await this.honService.deductHon(
        visitorId,
        remainingHon,
        '환불 처리로 인한 회수',
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
          `\n\n[환불 완료]\n${new Date().toLocaleString()}에 ${refundAmount.toLocaleString()}원 환불 처리가 성공적으로 완료되었습니다.`,
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
    const visitorId = this.requestParser.getVisitorId();
    if (!visitorId) {
      throw new BadRequestException('방문자 ID가 존재하지 않습니다.');
    }

    const inquiry = await prisma.inquiry.findFirst({
      where: { id: numId, visitorId },
    });
    if (!inquiry) {
      throw new NotFoundException('문의 내역을 찾을 수 없습니다.');
    }
    if (inquiry.type !== InquiryType.REFUND) {
      throw new BadRequestException('환불 문의가 아닙니다.');
    }
    if (inquiry.refundStatus !== 'PROPOSED') {
      throw new BadRequestException('승인 제안 상태가 아닙니다.');
    }

    const updatedInquiry = await prisma.inquiry.update({
      where: { id: numId },
      data: {
        refundStatus: 'CANCELLED',
        status: 'ANSWERED',
        answeredAt: new Date(),
        answer:
          inquiry.answer +
          `\n\n[문의 취소]\n사용자가 환불 요청을 취소하였습니다.`,
      },
    });

    return { success: true, data: updatedInquiry };
  }

  @ApiOperation({ summary: 'Get visitor hon events' })
  @Get('hon-events')
  async getHonEvents() {
    const visitorId = this.requestParser.getVisitorId();
    if (!visitorId) {
      throw new BadRequestException('방문자 ID가 존재하지 않습니다.');
    }

    const events = await this.honService.getHonEvents(visitorId);
    return { success: true, data: events };
  }
}
