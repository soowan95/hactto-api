export const HON_REPOSITORY_TOKEN = Symbol('HON_REPOSITORY_TOKEN');

export interface HonData {
  visitorId: string;
  balance: number;
  updatedAt?: Date;
}

export interface SubscriptionData {
  visitorId: string;
  plan: string;
  status: string;
  billingKey: string;
  nextPaymentAt: Date;
  startsAt: Date;
  endsAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IHonRepository {
  /**
   * 방문자의 혼(Hon) 정보를 조회합니다.
   */
  getHon(visitorId: string): Promise<HonData | null>;

  /**
   * 방문자의 혼(Hon) 정보를 저장/갱신합니다.
   */
  saveHon(data: HonData): Promise<void>;

  /**
   * 방문자의 구독 정보를 조회합니다.
   */
  getSubscription(visitorId: string): Promise<SubscriptionData | null>;

  /**
   * 방문자의 구독 정보를 저장/갱신합니다.
   */
  saveSubscription(data: SubscriptionData): Promise<void>;
}
