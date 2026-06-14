import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ReadyPaymentRequestDto {
  @IsString()
  @IsNotEmpty()
  visitorId: string;

  @IsNumber()
  amount: number;

  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  orderName: string;
}

export class ConfirmPaymentRequestDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  paymentKey: string;

  @IsNumber()
  amount: number;
}

export class CancelPaymentRequestDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class FailPaymentRequestDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  failReason: string;
}
