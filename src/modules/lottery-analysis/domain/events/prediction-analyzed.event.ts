import { DomainAnalysis } from '../aggregates/analysis.entity';

export class PredictionAnalyzedEvent {
  constructor(
    public readonly userId: string | undefined,
    public readonly analysis: DomainAnalysis,
  ) {}
}
