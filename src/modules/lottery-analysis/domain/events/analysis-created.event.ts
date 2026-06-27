export class AnalysisCreatedEvent {
  constructor(
    public readonly predictionId: number,
    public readonly analysisId: number,
  ) {}
}
