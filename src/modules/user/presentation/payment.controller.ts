import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PaymentService } from '../application/payment.service';
import {
  ReadyPaymentRequestDto,
  ConfirmPaymentRequestDto,
  CancelPaymentRequestDto,
} from './dtos/requests/payment-requests.dto';
import {
  ReadyPaymentResponseDto,
  ConfirmPaymentResponseDto,
  CancelPaymentResponseDto,
  PaymentResponseDto,
} from './dtos/responses/payment-responses.dto';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

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

  @Get(':id')
  async get(@Param('id') id: string): Promise<PaymentResponseDto> {
    const aggregate = await this.paymentService.getPayment(id);
    return plainToInstance(PaymentResponseDto, aggregate.toProjection(), {
      excludeExtraneousValues: true,
    });
  }
}
