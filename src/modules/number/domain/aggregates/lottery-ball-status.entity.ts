import { LottoNumber } from '../vos/lotto-number.vo';
import { BallTemperature } from '../vos/ball.temperature.vo';

export class LotteryBallStatus {
  public readonly recentTen: number; // 최근 10회 등장 횟수
  public readonly recentThirty: number; // 최근 30회 등장 횟수
  public readonly status: BallTemperature; // 열번호 | 온번호 | 냉번호
  public readonly skip: number; // 미출현 간격
  public readonly friendlyNumbers: LottoNumber[]; // 동반수
  public readonly latestEpisode: number; // 최근 등장 회차

  constructor(
    recentTen: number,
    recentThirty: number,
    status: BallTemperature,
    skip: number,
    friendlyNumbers: number[],
    latestEpisode: number,
  ) {
    this.recentTen = recentTen;
    this.recentThirty = recentThirty;
    this.status = status;
    this.skip = skip;
    this.friendlyNumbers = friendlyNumbers.map(
      (number) => new LottoNumber(number),
    );
    this.latestEpisode = latestEpisode;
  }

  getFriendlyNumberArray(): number[] {
    return this.friendlyNumbers.map((number) => number.value);
  }
}
