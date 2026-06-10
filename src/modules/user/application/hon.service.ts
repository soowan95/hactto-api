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

  /**
   * 3. 방문자 혼 정보 조회
   */
  async getHon(visitorId: string) {
    return this.honRepository.getHon(visitorId);
  }

  /**
   * 4. 방문자 정기 구독 조회
   */
  async getSubscription(visitorId: string) {
    return this.honRepository.getSubscription(visitorId);
  }

  /**
   * 5. 방문자 혼 차감 (구독자인 경우 면제)
   */
  async deductHon(visitorId: string, amount: number): Promise<void> {
    const subscription = await this.honRepository.getSubscription(visitorId);
    if (subscription && subscription.status === 'ACTIVE') {
      return; // ACTIVE 구독자는 무제한
    }

    const hon = await this.honRepository.getHon(visitorId);
    const balance = hon ? hon.balance : 0;
    if (balance < amount) {
      throw new Error(
        `HON이 부족합니다. 충전 후 이용해 주세요. (필요: ${amount} HON, 보유: ${balance} HON)`,
      );
    }

    await this.honRepository.saveHon({
      visitorId,
      balance: balance - amount,
    });
  }
}
