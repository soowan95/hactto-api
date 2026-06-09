import {
  PaymentEventRecord,
  PaymentProjectionData,
} from '../ports/payment.port';

export class PaymentAggregate {
  private paymentId: string;
  private visitorId: string;
  private amount: number;
  private orderId: string;
  private orderName: string;
  private status: string; // READY, PAID, CANCELLED, FAILED
  private paymentKey?: string | null;
  private failReason?: string | null;
  private approvedAt?: Date | null;
  private cancelledAt?: Date | null;
  private version: number = 0;

  private uncommittedEvents: PaymentEventRecord[] = [];

  private constructor() {}

  // 신규 결제 초기화 (READY 상태 생성)
  public static create(
    paymentId: string,
    visitorId: string,
    amount: number,
    orderId: string,
    orderName: string,
  ): PaymentAggregate {
    const aggregate = new PaymentAggregate();
    aggregate.apply(
      {
        paymentId,
        version: 1,
        eventType: 'PaymentRequested',
        payload: { visitorId, amount, orderId, orderName },
      },
      true,
    );
    return aggregate;
  }

  // 기존 이벤트 로그를 재수행(Replay)하여 Aggregate 상태 복원
  public static rebuild(events: PaymentEventRecord[]): PaymentAggregate {
    const aggregate = new PaymentAggregate();
    for (const event of events) {
      aggregate.apply(event, false);
    }
    return aggregate;
  }

  // 결제 완료/승인 처리
  public approve(paymentKey: string, approvedAt: Date): void {
    if (this.status !== 'READY') {
      throw new Error(
        `Invalid state transition. Cannot approve from ${this.status}`,
      );
    }
    this.apply(
      {
        paymentId: this.paymentId,
        version: this.version + 1,
        eventType: 'PaymentApproved',
        payload: { paymentKey, approvedAt },
      },
      true,
    );
  }

  // 결제 실패 처리
  public fail(failReason: string): void {
    if (this.status !== 'READY') {
      throw new Error(
        `Invalid state transition. Cannot fail from ${this.status}`,
      );
    }
    this.apply(
      {
        paymentId: this.paymentId,
        version: this.version + 1,
        eventType: 'PaymentFailed',
        payload: { failReason },
      },
      true,
    );
  }

  // 결제 취소 처리
  public cancel(cancelledAt: Date): void {
    if (this.status !== 'PAID') {
      throw new Error(
        `Invalid state transition. Cannot cancel from ${this.status}`,
      );
    }
    this.apply(
      {
        paymentId: this.paymentId,
        version: this.version + 1,
        eventType: 'PaymentCancelled',
        payload: { cancelledAt },
      },
      true,
    );
  }

  public getUncommittedEvents(): PaymentEventRecord[] {
    return this.uncommittedEvents;
  }

  public clearUncommittedEvents(): void {
    this.uncommittedEvents = [];
  }

  public toProjection(): PaymentProjectionData {
    return {
      paymentId: this.paymentId,
      visitorId: this.visitorId,
      amount: this.amount,
      orderId: this.orderId,
      orderName: this.orderName,
      status: this.status,
      paymentKey: this.paymentKey,
      failReason: this.failReason,
      approvedAt: this.approvedAt,
      cancelledAt: this.cancelledAt,
    };
  }

  public getVersion(): number {
    return this.version;
  }

  public getPaymentId(): string {
    return this.paymentId;
  }

  // 내부 상태 전이 메서드
  private apply(event: PaymentEventRecord, isNew: boolean): void {
    switch (event.eventType) {
      case 'PaymentRequested':
        this.paymentId = event.paymentId;
        this.visitorId = event.payload.visitorId;
        this.amount = event.payload.amount;
        this.orderId = event.payload.orderId;
        this.orderName = event.payload.orderName;
        this.status = 'READY';
        break;
      case 'PaymentApproved':
        this.status = 'PAID';
        this.paymentKey = event.payload.paymentKey;
        this.approvedAt = new Date(event.payload.approvedAt);
        break;
      case 'PaymentFailed':
        this.status = 'FAILED';
        this.failReason = event.payload.failReason;
        break;
      case 'PaymentCancelled':
        this.status = 'CANCELLED';
        this.cancelledAt = new Date(event.payload.cancelledAt);
        break;
    }
    this.version = event.version;
    if (isNew) {
      this.uncommittedEvents.push(event);
    }
  }
}
