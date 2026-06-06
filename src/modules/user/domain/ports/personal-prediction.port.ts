import { DomainPersonalAnalysis } from '../aggregates/personal-analysis.entity';
import { DomainPersonalPrediction } from '../aggregates/personal-perdiction.entity';

export const PERSONAL_PREDICTION_REPOSITORY_TOKEN =
  'IPersonalPredictionRepository';

export interface IPersonalPredictionRepository {
  save(
    prediction: DomainPersonalPrediction,
    analysis: DomainPersonalAnalysis,
  ): Promise<void>;
  findByUser(visitorId: string): Promise<
    {
      prediction: DomainPersonalPrediction;
      analysis: DomainPersonalAnalysis | null;
    }[]
  >;
}
