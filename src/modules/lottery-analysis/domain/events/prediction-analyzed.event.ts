import { DomainAnalysis } from '../aggregates/analysis.entity';

export class PredictionAnalyzedEvent {
  constructor(
    public readonly visitorId: string | undefined,
    public readonly analysis: DomainAnalysis,
  ) {}
}
