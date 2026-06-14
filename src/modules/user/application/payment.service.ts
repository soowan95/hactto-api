import {
  Inject,
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  IPaymentRepository,
  PAYMENT_REPOSITORY_TOKEN,
} from '../domain/ports/payment.port';
import { PaymentAggregate } from '../domain/aggregates/payment.aggregate';
import { PortoneClient } from '../infrastructure/clients/portone.client';
import { HonService } from './hon.service';
import { randomUUID } from 'crypto';

@Injectable()
export class PaymentService {
  constructor(
    @Inject(PAYMENT_REPOSITORY_TOKEN)
    private readonly paymentRepository: IPaymentRepository,
    private readonly portoneClient: PortoneClient,
    private readonly honService: HonService,
  ) {}

  /**
   * 1. 결제 준비 단계 (Command: Request Payment)
   */
  async readyPayment(
    visitorId: string,
    amount: number,
    orderId: string,
    orderName: string,
  ): Promise<PaymentAggregate> {
    const paymentId = randomUUID();

    // Aggregate 생성 (내부적으로 version 1의 PaymentRequested 이벤트 발행)
    const aggregate = PaymentAggregate.create(
      paymentId,
      visitorId,
      amount,
      orderId,
      orderName,
    );

    // 이벤트 저장 및 프로젝션 캐싱
    await this.save(aggregate);

    return aggregate;
  }

  /**
   * 2. 결제 승인 확인 단계 (Command: Confirm Payment)
   */
  async confirmPayment(
    orderId: string,
    paymentKey: string,
    amount: number,
  ): Promise<PaymentAggregate> {
    const projection =
      await this.paymentRepository.getProjectionByOrderId(orderId);
    if (!projection) {
      throw new NotFoundException(
        `Payment projection not found for orderId: ${orderId}`,
      );
    }

    // 기존 이벤트 재플레이를 통한 Aggregate 복원
    const events = await this.paymentRepository.getEvents(projection.paymentId);
    const aggregate = PaymentAggregate.rebuild(events);

    // 포트원 연동 API 호출 (정기 결제금액인 경우 빌링키 결제 승인 호출)
    const isSubscription = amount === 12000 || amount === 100000;
    const portoneResult = isSubscription
      ? await this.portoneClient.payWithBillingKey(
          projection.paymentId,
          paymentKey, // 프론트엔드에서 전달된 빌링키
          amount,
          projection.orderName,
        )
      : await this.portoneClient.confirmPayment(paymentKey, orderId, amount);

    if (portoneResult.success) {
      aggregate.approve(paymentKey, portoneResult.approvedAt || new Date());
    } else {
      aggregate.fail(portoneResult.failReason || 'Confirmation failed');
    }

    // 상태 변화를 저장 및 프로젝션에 반영
    await this.save(aggregate);

    // 결제 승인 완료 시 금액별 크레딧(Hon) 충전 또는 정기 구독 권한 지급 처리
    if (portoneResult.success) {
      const visitorId = projection.visitorId;
      const paymentId = projection.paymentId;

      if (amount === 1000) {
        await this.honService.chargeHon(paymentId, visitorId, 30);
      } else if (amount === 3000) {
        await this.honService.chargeHon(paymentId, visitorId, 100);
      } else if (amount === 5000) {
        await this.honService.chargeHon(paymentId, visitorId, 200);
      } else if (amount === 12000) {
        await this.honService.startSubscription(
          paymentId,
          visitorId,
          'MONTHLY',
          paymentKey,
        );
      } else if (amount === 100000) {
        await this.honService.startSubscription(
          paymentId,
          visitorId,
          'YEARLY',
          paymentKey,
        );
      }
    }

    return aggregate;
  }

  /**
   * 3. 결제 취소 (Command: Cancel Payment)
   */
  async cancelPayment(
    paymentId: string,
    reason: string,
  ): Promise<PaymentAggregate> {
    const events = await this.paymentRepository.getEvents(paymentId);
    if (events.length === 0) {
      throw new NotFoundException(
        `Payment events not found for ID: ${paymentId}`,
      );
    }

    const aggregate = PaymentAggregate.rebuild(events);

    // 외부 포트원 취소 API 호출
    const portoneResult = await this.portoneClient.cancelPayment(
      paymentId,
      reason,
    );

    if (!portoneResult.success) {
      throw new BadRequestException(
        portoneResult.failReason || 'Cancellation failed',
      );
    }

    aggregate.cancel(portoneResult.cancelledAt || new Date());

    await this.save(aggregate);

    return aggregate;
  }

  /**
   * 결제 실패 처리 (Command: Fail Payment)
   */
  async failPayment(
    orderId: string,
    failReason: string,
  ): Promise<PaymentAggregate> {
    const projection =
      await this.paymentRepository.getProjectionByOrderId(orderId);
    if (!projection) {
      throw new NotFoundException(
        `Payment projection not found for orderId: ${orderId}`,
      );
    }

    const events = await this.paymentRepository.getEvents(projection.paymentId);
    const aggregate = PaymentAggregate.rebuild(events);

    aggregate.fail(failReason);

    await this.save(aggregate);

    return aggregate;
  }

  /**
   * 4. 결제 프로젝션 단건 조회
   */
  async getPayment(paymentId: string): Promise<PaymentAggregate> {
    const events = await this.paymentRepository.getEvents(paymentId);
    if (events.length === 0) {
      throw new NotFoundException(`Payment not found with ID: ${paymentId}`);
    }
    return PaymentAggregate.rebuild(events);
  }

  /**
   * Aggregate 도메인 객체의 이벤트를 데이터베이스에 반영
   */
  private async save(aggregate: PaymentAggregate): Promise<void> {
    const events = aggregate.getUncommittedEvents();

    for (const event of events) {
      await this.paymentRepository.saveEvent(event);
    }

    // 리드 모델 업데이트
    const projection = aggregate.toProjection();
    await this.paymentRepository.saveProjection(projection);

    // 저장 성공 후 Aggregate 내부 큐 비우기
    aggregate.clearUncommittedEvents();
  }
}
