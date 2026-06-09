import { Injectable } from '@nestjs/common';
import {
  IHonRepository,
  HonData,
  SubscriptionData,
} from '../../domain/ports/hon.port';
import { prisma } from '../../../../libs/prisma';

@Injectable()
export class InfraHonRepository implements IHonRepository {
  async getHon(visitorId: string): Promise<HonData | null> {
    const record = await prisma.hon.findUnique({
      where: { visitorId },
    });
    if (!record) return null;
    return {
      visitorId: record.visitorId,
      balance: record.balance,
      updatedAt: record.updatedAt,
    };
  }

  async saveHon(data: HonData): Promise<void> {
    const visitorExists = await prisma.visitor.findUnique({
      where: { id: data.visitorId },
    });
    if (!visitorExists) {
      await prisma.visitor.create({
        data: {
          id: data.visitorId,
          ip: '0.0.0.0',
        },
      });
    }

    await prisma.hon.upsert({
      where: { visitorId: data.visitorId },
      update: { balance: data.balance },
      create: {
        visitorId: data.visitorId,
        balance: data.balance,
      },
    });
  }

  async getSubscription(visitorId: string): Promise<SubscriptionData | null> {
    const record = await prisma.subscription.findUnique({
      where: { visitorId },
    });
    if (!record) return null;
    return record;
  }

  async saveSubscription(data: SubscriptionData): Promise<void> {
    const visitorExists = await prisma.visitor.findUnique({
      where: { id: data.visitorId },
    });
    if (!visitorExists) {
      await prisma.visitor.create({
        data: {
          id: data.visitorId,
          ip: '0.0.0.0',
        },
      });
    }

    const updateData = {
      plan: data.plan,
      status: data.status,
      billingKey: data.billingKey,
      nextPaymentAt: data.nextPaymentAt,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
    };

    await prisma.subscription.upsert({
      where: { visitorId: data.visitorId },
      update: updateData,
      create: {
        visitorId: data.visitorId,
        ...updateData,
      },
    });
  }
}
