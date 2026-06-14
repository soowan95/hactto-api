import { Expose } from 'class-transformer';

export class ReadyPaymentResponseDto {
  @Expose()
  paymentId: string;

  @Expose()
  status: string;
}

export class PaymentResponseDto {
  @Expose()
  paymentId: string;

  @Expose()
  visitorId: string;

  @Expose()
  amount: number;

  @Expose()
  orderId: string;

  @Expose()
  orderName: string;

  @Expose()
  status: string;

  @Expose()
  paymentKey?: string;

  @Expose()
  failReason?: string;

  @Expose()
  approvedAt?: Date;

  @Expose()
  cancelledAt?: Date;
}
export class ConfirmPaymentResponseDto extends PaymentResponseDto {}
export class CancelPaymentResponseDto extends PaymentResponseDto {}
export class FailPaymentResponseDto extends PaymentResponseDto {}
