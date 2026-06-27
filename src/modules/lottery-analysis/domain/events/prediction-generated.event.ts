export class PredictionGeneratedEvent {
  constructor(
    public readonly predictionId: number,
    public readonly algorithmType: string,
    public readonly episode: number,
    public readonly visitorId: string | undefined,
    public readonly generatedNumbers: number[],
  ) {}
}
