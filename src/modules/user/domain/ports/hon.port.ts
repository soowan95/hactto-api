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

export interface HonEventData {
  id?: number;
  visitorId: string;
  type: string;
  amount: number;
  balance: number;
  description?: string | null;
  createdAt?: Date;
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

  /**
   * 만료된(또는 만료 예정인) 활성 구독 목록을 조회합니다.
   */
  findExpiredSubscriptions(now: Date): Promise<SubscriptionData[]>;

  /**
   * 혼(Hon) 이벤트를 기록합니다.
   */
  saveHonEvent(event: HonEventData): Promise<void>;

  /**
   * 방문자의 혼(Hon) 이벤트 기록들을 가져옵니다.
   */
  getHonEvents(visitorId: string): Promise<HonEventData[]>;
}
