import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PaymentService } from '../application/payment.service';
import { HonService } from '../application/hon.service';
import {
  ReadyPaymentRequestDto,
  ConfirmPaymentRequestDto,
  CancelPaymentRequestDto,
  FailPaymentRequestDto,
} from './dtos/requests/payment-requests.dto';
import {
  ReadyPaymentResponseDto,
  ConfirmPaymentResponseDto,
  CancelPaymentResponseDto,
  PaymentResponseDto,
  FailPaymentResponseDto,
} from './dtos/responses/payment-responses.dto';

@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly honService: HonService,
  ) {}

  @Get(':id')
  async get(@Param('id') id: string): Promise<PaymentResponseDto> {
    const aggregate = await this.paymentService.getPayment(id);
    return plainToInstance(PaymentResponseDto, aggregate.toProjection(), {
      excludeExtraneousValues: true,
    });
  }

  @Post('ready')
  async ready(
    @Body() dto: ReadyPaymentRequestDto,
  ): Promise<ReadyPaymentResponseDto> {
    const aggregate = await this.paymentService.readyPayment(
      dto.visitorId,
      dto.amount,
      dto.orderId,
      dto.orderName,
    );
    return plainToInstance(ReadyPaymentResponseDto, aggregate.toProjection(), {
      excludeExtraneousValues: true,
    });
  }

  @Post('confirm')
  async confirm(
    @Body() dto: ConfirmPaymentRequestDto,
  ): Promise<ConfirmPaymentResponseDto> {
    const aggregate = await this.paymentService.confirmPayment(
      dto.orderId,
      dto.paymentKey,
      dto.amount,
    );
    return plainToInstance(
      ConfirmPaymentResponseDto,
      aggregate.toProjection(),
      {
        excludeExtraneousValues: true,
      },
    );
  }

  @Post('fail')
  async fail(
    @Body() dto: FailPaymentRequestDto,
  ): Promise<FailPaymentResponseDto> {
    const aggregate = await this.paymentService.failPayment(
      dto.orderId,
      dto.failReason,
    );
    return plainToInstance(FailPaymentResponseDto, aggregate.toProjection(), {
      excludeExtraneousValues: true,
    });
  }

  @Post(':id/cancel')
  async cancel(
    @Param('id') id: string,
    @Body() dto: CancelPaymentRequestDto,
  ): Promise<CancelPaymentResponseDto> {
    const aggregate = await this.paymentService.cancelPayment(id, dto.reason);
    return plainToInstance(CancelPaymentResponseDto, aggregate.toProjection(), {
      excludeExtraneousValues: true,
    });
  }

  @Post('subscription/cancel')
  async cancelSubscription(
    @Body('visitorId') visitorId: string,
  ): Promise<{ success: boolean }> {
    await this.honService.cancelSubscription(visitorId);
    return { success: true };
  }
}
