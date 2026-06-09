import { Inject, Injectable } from '@nestjs/common';
import { IHonRepository, HON_REPOSITORY_TOKEN } from '../domain/ports/hon.port';
import {
  IPaymentRepository,
  PAYMENT_REPOSITORY_TOKEN,
} from '../domain/ports/payment.port';

@Injectable()
export class HonService {
  constructor(
    @Inject(HON_REPOSITORY_TOKEN)
    private readonly honRepository: IHonRepository,
    @Inject(PAYMENT_REPOSITORY_TOKEN)
    private readonly paymentRepository: IPaymentRepository,
  ) {}

  /**
   * 1. 단건 결제 성공에 따른 혼(Hon) 크레딧 지급 및 이벤트 발행
   */
  async chargeHon(
    paymentId: string,
    visitorId: string,
    honAmount: number,
  ): Promise<void> {
    const currentEvents = await this.paymentRepository.getEvents(paymentId);
    const nextVersion = currentEvents.length + 1;

    await this.paymentRepository.saveEvent({
      paymentId,
      version: nextVersion,
      eventType: 'HonCharged',
      payload: { visitorId, chargedHon: honAmount },
    });

    const currentHon = await this.honRepository.getHon(visitorId);
    const currentBalance = currentHon ? currentHon.balance : 0;

    await this.honRepository.saveHon({
      visitorId,
      balance: currentBalance + honAmount,
    });
  }

  /**
   * 2. 정기 구독 최초 가입(빌링키 발급)에 따른 혜택 시작 및 이벤트 발행
   */
  async startSubscription(
    paymentId: string,
    visitorId: string,
    plan: string,
    billingKey: string,
  ): Promise<void> {
    const currentEvents = await this.paymentRepository.getEvents(paymentId);
    const nextVersion = currentEvents.length + 1;

    const now = new Date();
    const endsAt = new Date();
    if (plan === 'MONTHLY') {
      endsAt.setMonth(now.getMonth() + 1);
    } else {
      endsAt.setFullYear(now.getFullYear() + 1);
    }

    await this.paymentRepository.saveEvent({
      paymentId,
      version: nextVersion,
      eventType: 'SubscriptionStarted',
      payload: { visitorId, plan, billingKey, nextPaymentAt: endsAt },
    });

    await this.honRepository.saveSubscription({
      visitorId,
      plan,
      status: 'ACTIVE',
      billingKey,
      nextPaymentAt: endsAt,
      startsAt: now,
      endsAt,
    });
  }
}
