export class GetEpisodeBestPredictionQuery {
  constructor(
    public readonly episode: number,
    public readonly algorithmType: string,
  ) {}
}
