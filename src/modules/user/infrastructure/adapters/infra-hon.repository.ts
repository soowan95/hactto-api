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
  async getHon(userId: string): Promise<HonData | null> {
    const record = await prisma.hon.findUnique({
      where: { userId },
    });
    if (!record) return null;
    return {
      userId: record.userId,
      freeBalance: record.freeBalance,
      paidBalance: record.paidBalance,
      updatedAt: record.updatedAt,
    };
  }

  async saveHon(data: HonData): Promise<void> {
    await prisma.hon.upsert({
      where: { userId: data.userId },
      update: {
        freeBalance: data.freeBalance,
        paidBalance: data.paidBalance,
      },
      create: {
        userId: data.userId,
        freeBalance: data.freeBalance,
        paidBalance: data.paidBalance,
      },
    });
  }

  async getSubscription(userId: string): Promise<SubscriptionData | null> {
    const record = await prisma.subscription.findUnique({
      where: { userId },
    });
    if (!record) return null;
    return record;
  }

  async saveSubscription(data: SubscriptionData): Promise<void> {
    const updateData = {
      plan: data.plan,
      status: data.status,
      billingKey: data.billingKey,
      nextPaymentAt: data.nextPaymentAt,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
    };

    await prisma.subscription.upsert({
      where: { userId: data.userId },
      update: updateData,
      create: {
        userId: data.userId,
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
        userId: event.userId,
        type: event.type,
        amount: event.amount,
        freeAmount: event.freeAmount,
        paidAmount: event.paidAmount,
        balance: event.balance,
        description: event.description,
      },
    });
  }

  async getHonEvents(userId: string): Promise<HonEventData[]> {
    return prisma.honEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
