import { LottoNumber } from '../vos/lotto-number.vo';

export class LotteryBallStatus {
  public readonly recentTen: number;
  public readonly recentThirty: number;
  public readonly status: 'hot' | 'warm' | 'cold';
  public readonly friendlyNumbers: LottoNumber[];
  public readonly latestEpisode: number;

  constructor(
    recentTen: number,
    recentThirty: number,
    status: 'hot' | 'warm' | 'cold',
    friendlyNumbers: number[],
    latestEpisode: number,
  ) {
    this.recentTen = recentTen;
    this.recentThirty = recentThirty;
    this.status = status;
    this.friendlyNumbers = friendlyNumbers.map(
      (number) => new LottoNumber(number),
    );
    this.latestEpisode = latestEpisode;
  }

  getFriendlyNumberArray(): number[] {
    return this.friendlyNumbers.map((number) => number.value);
  }
}
