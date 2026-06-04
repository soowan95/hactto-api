import { DomainPredictionAnalysis } from '../aggregates/prediction-analysis.entity';

export const PREDICTION_ANALYSIS_REPOSITORY_TOKEN =
  'IPredictionAnalysisRepository';

export interface IPredictionAnalysisRepository {
  insert(predictionAnalysis: DomainPredictionAnalysis): Promise<void>;
}
