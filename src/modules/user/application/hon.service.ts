import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { IHonRepository, HON_REPOSITORY_TOKEN } from '../domain/ports/hon.port';
import {
  IPaymentRepository,
  PAYMENT_REPOSITORY_TOKEN,
} from '../domain/ports/payment.port';
import { randomUUID } from 'crypto';

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
    let startsAt = now;
    let endsAt = new Date();
    if (plan === 'MONTHLY') {
      endsAt.setMonth(now.getMonth() + 1);
    } else {
      endsAt.setFullYear(now.getFullYear() + 1);
    }

    // Check for existing active/cancelled subscription to extend the period if upgrading MONTHLY -> YEARLY
    const existing = await this.honRepository.getSubscription(visitorId);
    if (existing && existing.endsAt > now) {
      if (existing.plan === 'MONTHLY' && plan === 'YEARLY') {
        startsAt = existing.startsAt;
        endsAt = new Date(existing.endsAt);
        endsAt.setFullYear(endsAt.getFullYear() + 1);
      }
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
      startsAt,
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
   * 정기 구독 취소 (해지 예약)
   */
  async cancelSubscription(visitorId: string): Promise<void> {
    const subscription = await this.honRepository.getSubscription(visitorId);
    if (!subscription || subscription.status !== 'ACTIVE') {
      throw new BadRequestException(
        '해지 가능한 활성 구독이 존재하지 않습니다.',
      );
    }

    // 상태를 CANCELLED로 변경 (만료일까지 권한은 유지되나 자동 결제는 정지됨)
    await this.honRepository.saveSubscription({
      ...subscription,
      status: 'CANCELLED',
      updatedAt: new Date(),
    });

    // 구독 해지 이벤트 발행
    await this.paymentRepository.saveEvent({
      paymentId: randomUUID(),
      version: 1,
      eventType: 'SubscriptionCancelled',
      payload: { visitorId },
    });
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
      throw new BadRequestException(
        `HON이 부족합니다. 충전 후 이용해 주세요. (필요: ${amount} HON, 보유: ${balance} HON)`,
      );
    }

    await this.honRepository.saveHon({
      visitorId,
      balance: balance - amount,
    });
  }

  /**
   * 6. 관리자 수동 혼(Hon) 지급/차감
   */
  async provisionHonByAdmin(visitorId: string, amount: number): Promise<void> {
    const paymentId = `admin-provision-${randomUUID()}`;
    await this.paymentRepository.saveEvent({
      paymentId,
      version: 1,
      eventType: 'AdminHonProvisioned',
      payload: { visitorId, amount },
    });

    const currentHon = await this.honRepository.getHon(visitorId);
    const currentBalance = currentHon ? currentHon.balance : 0;
    const newBalance = Math.max(0, currentBalance + amount);

    await this.honRepository.saveHon({
      visitorId,
      balance: newBalance,
    });
  }

  async provisionUnlimitedSubscriptionByAdmin(
    visitorId: string,
    endsAt: Date,
  ): Promise<void> {
    const paymentId = `admin-unlimited-${randomUUID()}`;
    const now = new Date();

    await this.paymentRepository.saveEvent({
      paymentId,
      version: 1,
      eventType: 'AdminUnlimitedSubscriptionProvisioned',
      payload: { visitorId, startsAt: now, endsAt },
    });

    await this.honRepository.saveSubscription({
      visitorId,
      plan: 'UNLIMITED',
      status: 'ACTIVE',
      billingKey: 'ADMIN_FREE_PASS',
      nextPaymentAt: endsAt,
      startsAt: now,
      endsAt,
    });
  }
}
