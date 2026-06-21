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
    description?: string,
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
    const currentFree = currentHon ? currentHon.freeBalance : 0;
    const currentPaid = currentHon ? currentHon.paidBalance : 0;
    const newPaid = currentPaid + honAmount;
    const totalBalance = currentFree + newPaid;

    await this.honRepository.saveHon({
      visitorId,
      freeBalance: currentFree,
      paidBalance: newPaid,
    });

    await this.honRepository.saveHonEvent({
      visitorId,
      type: 'CHARGE',
      amount: honAmount,
      balance: totalBalance,
      description: description || '결제 충전',
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
  async deductHon(
    visitorId: string,
    amount: number,
    description?: string,
  ): Promise<void> {
    const subscription = await this.honRepository.getSubscription(visitorId);
    if (subscription && subscription.status === 'ACTIVE') {
      return; // ACTIVE 구독자는 무제한
    }

    const hon = await this.honRepository.getHon(visitorId);
    const free = hon ? hon.freeBalance : 0;
    const paid = hon ? hon.paidBalance : 0;
    const totalBalance = free + paid;

    if (totalBalance < amount) {
      throw new BadRequestException(
        `HON이 부족합니다. 충전 후 이용해 주세요. (필요: ${amount} HON, 보유: ${totalBalance} HON)`,
      );
    }

    let remainingDeduct = amount;
    let newFree = free;
    let newPaid = paid;

    // 무료(이벤트) HON 우선 차감
    if (newFree >= remainingDeduct) {
      newFree -= remainingDeduct;
      remainingDeduct = 0;
    } else {
      remainingDeduct -= newFree;
      newFree = 0;
    }

    // 부족분은 유료 HON에서 차감
    if (remainingDeduct > 0) {
      newPaid -= remainingDeduct;
    }

    const newTotalBalance = newFree + newPaid;

    await this.honRepository.saveHon({
      visitorId,
      freeBalance: newFree,
      paidBalance: newPaid,
    });

    await this.honRepository.saveHonEvent({
      visitorId,
      type: 'DEDUCT',
      amount: -amount,
      balance: newTotalBalance,
      description: description || '혼 차감',
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
    const free = currentHon ? currentHon.freeBalance : 0;
    const paid = currentHon ? currentHon.paidBalance : 0;

    // 관리자 지급/차감은 우선 paidBalance에 반영하되 음수가 되지 않도록 설정
    const newPaid = Math.max(0, paid + amount);
    const newTotalBalance = free + newPaid;

    await this.honRepository.saveHon({
      visitorId,
      freeBalance: free,
      paidBalance: newPaid,
    });

    await this.honRepository.saveHonEvent({
      visitorId,
      type: amount >= 0 ? 'ADMIN_PROVISION' : 'ADMIN_DEDUCT',
      amount,
      balance: newTotalBalance,
      description: amount >= 0 ? '관리자 지급' : '관리자 차감',
    });
  }

  async getHonEvents(visitorId: string) {
    return this.honRepository.getHonEvents(visitorId);
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
