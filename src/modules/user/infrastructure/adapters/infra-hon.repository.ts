import { Injectable } from '@nestjs/common';
import {
  IHonRepository,
  HonData,
  SubscriptionData,
  HonEventData,
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
      freeBalance: record.freeBalance,
      paidBalance: record.paidBalance,
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
      update: {
        freeBalance: data.freeBalance,
        paidBalance: data.paidBalance,
      },
      create: {
        visitorId: data.visitorId,
        freeBalance: data.freeBalance,
        paidBalance: data.paidBalance,
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

  async findExpiredSubscriptions(now: Date): Promise<SubscriptionData[]> {
    return prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        nextPaymentAt: {
          lte: now,
        },
      },
    });
  }

  async saveHonEvent(event: HonEventData): Promise<void> {
    await prisma.honEvent.create({
      data: {
        visitorId: event.visitorId,
        type: event.type,
        amount: event.amount,
        balance: event.balance,
        description: event.description,
      },
    });
  }

  async getHonEvents(visitorId: string): Promise<HonEventData[]> {
    return prisma.honEvent.findMany({
      where: { visitorId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
