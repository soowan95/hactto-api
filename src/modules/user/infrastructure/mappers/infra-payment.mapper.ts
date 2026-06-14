import {
  PaymentEvent,
  PaymentProjection,
} from '../../../../generated/prisma/client';
import {
  PaymentEventRecord,
  PaymentProjectionData,
} from '../../domain/ports/payment.port';

export class InfraPaymentMapper {
  static toEventRecord(raw: PaymentEvent): PaymentEventRecord {
    return {
      id: raw.id,
      paymentId: raw.paymentId,
      version: raw.version,
      eventType: raw.eventType,
      payload: raw.payload,
      createdAt: raw.createdAt,
    };
  }

  static toProjectionData(raw: PaymentProjection): PaymentProjectionData {
    return {
      paymentId: raw.paymentId,
      visitorId: raw.visitorId,
      amount: raw.amount,
      orderId: raw.orderId,
      orderName: raw.orderName,
      status: raw.status,
      paymentKey: raw.paymentKey,
      failReason: raw.failReason,
      approvedAt: raw.approvedAt,
      cancelledAt: raw.cancelledAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }
}
