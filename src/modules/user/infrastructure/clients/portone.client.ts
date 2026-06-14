import { Injectable, Logger } from '@nestjs/common';
import { PaymentClient } from '@portone/server-sdk';

@Injectable()
export class PortoneClient {
  private readonly logger = new Logger(PortoneClient.name);
  private readonly paymentClient: ReturnType<typeof PaymentClient>;

  constructor() {
    const apiSecret = process.env.PORTONE_API_SECRET || 'test_secret_key';
    this.logger.log(
      `Initializing PortoneClient with API secret starting with: ${apiSecret ? apiSecret.substring(0, 8) : 'null'}`,
    );
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
        `Confirming payment via Portone SDK: orderId=${orderId}, paymentKey=${paymentKey}, amount=${amount}`,
      );

      // paymentKey가 orderId와 같거나 없는 경우 -> 즉시 승인(Instant confirmation) 건으로 판단하고 단건 조회 검증 진행
      if (paymentKey === orderId || !paymentKey) {
        this.logger.log(
          `Instant payment detected. Querying payment details from PortOne...`,
        );
        const payment = await this.paymentClient.getPayment({
          paymentId: orderId,
        });

        if (payment.status === 'PAID') {
          // 결제 금액 검증
          if (payment.amount.total !== amount) {
            return {
              success: false,
              failReason: `Amount mismatch: expected ${amount}, got ${payment.amount.total}`,
            };
          }
          return {
            success: true,
            approvedAt: payment.paidAt ? new Date(payment.paidAt) : new Date(),
          };
        }

        return {
          success: false,
          failReason: `Payment status is ${String(payment.status)}, expected PAID`,
        };
      }

      // 수동 승인 건: paymentToken(paymentKey)를 활용하여 결제 승인 호출
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

  /**
   * 포트원 빌링키 결제 승인 요청
   */
  async payWithBillingKey(
    paymentId: string,
    billingKey: string,
    amount: number,
    orderName: string,
  ): Promise<{ success: boolean; failReason?: string; approvedAt?: Date }> {
    try {
      this.logger.log(
        `Requesting billing key payment via Portone SDK: paymentId=${paymentId}, billingKey=${billingKey.substring(0, 15)}..., amount=${amount}`,
      );

      await this.paymentClient.payWithBillingKey({
        paymentId,
        billingKey,
        orderName,
        amount: {
          total: amount,
        },
        currency: 'KRW',
      });

      return {
        success: true,
        approvedAt: new Date(),
      };
    } catch (error: any) {
      this.logger.error(
        'Portone SDK payWithBillingKey failed',
        error.message || error,
      );
      return {
        success: false,
        failReason: error.message || 'Portone SDK billing key payment failed',
      };
    }
  }
}
