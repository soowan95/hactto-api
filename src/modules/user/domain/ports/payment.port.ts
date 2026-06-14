export const PAYMENT_REPOSITORY_TOKEN = Symbol('PAYMENT_REPOSITORY_TOKEN');

export interface PaymentEventRecord {
  id?: string;
  paymentId: string;
  version: number;
  eventType: string;
  payload: any;
  createdAt?: Date;
}

export interface PaymentProjectionData {
  paymentId: string;
  visitorId: string;
  amount: number;
  orderId: string;
  orderName: string;
  status: string;
  paymentKey?: string | null;
  failReason?: string | null;
  approvedAt?: Date | null;
  cancelledAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPaymentRepository {
  /**
   * 이벤트를 Event Store에 기록합니다.
   * 낙관적 락(Optimistic Locking)을 위해 version 유일성 제약 조건이 동작합니다.
   */
  saveEvent(event: PaymentEventRecord): Promise<void>;

  /**
   * 특정 paymentId의 모든 이벤트를 조회하여 순서대로 정렬해 가져옵니다.
   */
  getEvents(paymentId: string): Promise<PaymentEventRecord[]>;

  /**
   * 결제 Projection 리드 모델을 업데이트하거나 삽입(Upsert)합니다.
   */
  saveProjection(projection: PaymentProjectionData): Promise<void>;

  /**
   * 결제 Projection ID로 단건 조회합니다.
   */
  getProjection(paymentId: string): Promise<PaymentProjectionData | null>;

  /**
   * orderId로 결제 Projection 단건 조회합니다.
   */
  getProjectionByOrderId(
    orderId: string,
  ): Promise<PaymentProjectionData | null>;
}
