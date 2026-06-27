export class GetLotteryBallStatusQuery {
  constructor(
    public readonly ball: number,
    public readonly beforeEpisode?: number,
  ) {}
}
