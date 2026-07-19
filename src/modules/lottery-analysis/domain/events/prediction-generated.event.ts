export class PredictionGeneratedEvent {
  constructor(
    public readonly predictionId: number,
    public readonly algorithmType: string,
    public readonly episode: number,
    public readonly userId: string | undefined,
    public readonly generatedNumbers: number[],
  ) {}
}
