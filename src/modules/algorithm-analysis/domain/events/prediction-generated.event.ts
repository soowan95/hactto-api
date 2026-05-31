export class PredictionGeneratedEvent {
  constructor(
    public readonly predictionId: number,
    public readonly algorithm: string,
    public readonly episode: number,
    public readonly visitorId: string | undefined,
  ) {}
}
