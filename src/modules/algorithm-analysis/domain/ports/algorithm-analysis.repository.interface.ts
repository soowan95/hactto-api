import { AlgorithmType } from '@hactto/algorithm';
import { DomainPrediction } from '../aggregates/prediction.entity';

export const ALGORITHM_ANALYSIS_REPOSITORY_TOKEN =
  'IAlgorithmAnalysisRepository';

export interface IAlgorithmAnalysisRepository {
  create(analysis: DomainPrediction): Promise<DomainPrediction>;
  save(analysis: DomainPrediction): Promise<void>;
  saveMany(analyses: DomainPrediction[]): Promise<void>;
  findByUser(visitorId?: string): Promise<DomainPrediction[]>;
  findWithoutReliability(): Promise<DomainPrediction[]>;
  count(): Promise<number>;
  getAverageScore(algorithm?: AlgorithmType): Promise<number>;
}
