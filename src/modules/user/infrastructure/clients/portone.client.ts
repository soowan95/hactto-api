import { Injectable, Logger } from '@nestjs/common';
import { PaymentClient } from '@portone/server-sdk';

@Injectable()
export class PortoneClient {
  private readonly logger = new Logger(PortoneClient.name);
  private readonly paymentClient: ReturnType<typeof PaymentClient>;

  constructor() {
    const apiSecret = process.env.PORTONE_API_SECRET || 'test_secret_key';
    this.paymentClient = PaymentClient({ secret: apiSecret });
  }

  /**
   * 포트원 결제 승인 요청 (토스 페이먼츠 confirm)
   */
  async confirmPayment(
    paymentKey: string,
    orderId: string,
    amount: number,
  ): Promise<{ success: boolean; failReason?: string; approvedAt?: Date }> {
    try {
      this.logger.log(
        `Confirming payment via Portone SDK: orderId=${orderId}, amount=${amount}`,
      );

      // SDK를 사용하여 결제 승인 호출 (V2 수동 승인 API 호출 시 paymentToken(paymentKey) 명시 필수)
      await this.paymentClient.confirmPayment({
        paymentId: orderId,
        paymentToken: paymentKey,
      });

      return {
        success: true,
        approvedAt: new Date(),
      };
    } catch (error: any) {
      this.logger.error(
        'Portone SDK confirmPayment failed',
        error.message || error,
      );
      return {
        success: false,
        failReason: error.message || 'Portone SDK confirmation failed',
      };
    }
  }

  /**
   * 포트원 결제 취소 요청
   */
  async cancelPayment(
    paymentId: string,
    reason: string,
  ): Promise<{ success: boolean; cancelledAt?: Date; failReason?: string }> {
    try {
      this.logger.log(
        `Cancelling payment via Portone SDK: paymentId=${paymentId}, reason=${reason}`,
      );

      // SDK를 사용하여 결제 취소 호출
      await this.paymentClient.cancelPayment({
        paymentId,
        reason,
      });

      return {
        success: true,
        cancelledAt: new Date(),
      };
    } catch (error: any) {
      this.logger.error(
        'Portone SDK cancelPayment failed',
        error.message || error,
      );
      return {
        success: false,
        failReason: error.message || 'Portone SDK cancellation failed',
      };
    }
  }
}
