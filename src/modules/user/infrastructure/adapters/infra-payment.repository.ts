import { Injectable } from '@nestjs/common';
import {
  IPaymentRepository,
  PaymentEventRecord,
  PaymentProjectionData,
} from '../../domain/ports/payment.port';
import { prisma } from '../../../../libs/prisma';
import { InfraPaymentMapper } from '../mappers/infra-payment.mapper';

@Injectable()
export class InfraPaymentRepository implements IPaymentRepository {
  async saveEvent(event: PaymentEventRecord): Promise<void> {
    await prisma.paymentEvent.create({
      data: {
        paymentId: event.paymentId,
        version: event.version,
        eventType: event.eventType,
        payload: event.payload as any,
      },
    });
  }

  async getEvents(paymentId: string): Promise<PaymentEventRecord[]> {
    const events = await prisma.paymentEvent.findMany({
      where: { paymentId },
      orderBy: { version: 'asc' },
    });
    return events.map((e) => InfraPaymentMapper.toEventRecord(e));
  }

  async saveProjection(projection: PaymentProjectionData): Promise<void> {
    const data = {
      visitorId: projection.visitorId,
      amount: projection.amount,
      orderId: projection.orderId,
      orderName: projection.orderName,
      status: projection.status,
      paymentKey: projection.paymentKey ?? null,
      failReason: projection.failReason ?? null,
      approvedAt: projection.approvedAt ?? null,
      cancelledAt: projection.cancelledAt ?? null,
    };

    await prisma.paymentProjection.upsert({
      where: { paymentId: projection.paymentId },
      update: data,
      create: {
        paymentId: projection.paymentId,
        ...data,
      },
    });
  }

  async getProjection(
    paymentId: string,
  ): Promise<PaymentProjectionData | null> {
    const record = await prisma.paymentProjection.findUnique({
      where: { paymentId },
    });
    if (!record) return null;
    return InfraPaymentMapper.toProjectionData(record);
  }

  async getProjectionByOrderId(
    orderId: string,
  ): Promise<PaymentProjectionData | null> {
    const record = await prisma.paymentProjection.findUnique({
      where: { orderId },
    });
    if (!record) return null;
    return InfraPaymentMapper.toProjectionData(record);
  }
}
