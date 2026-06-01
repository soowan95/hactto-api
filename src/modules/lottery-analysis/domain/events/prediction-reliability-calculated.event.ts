export class PredictionReliabilityCalculatedEvent {
  constructor(
    public readonly predictionId: number,
    public readonly episode: number,
    public readonly visitorId: string | undefined,
    public readonly score: number,
  ) {}
}
