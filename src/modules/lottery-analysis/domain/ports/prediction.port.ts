import { DomainPrediction } from '../aggregates/prediction.entity';
import { DomainAlgorithm } from '../aggregates/algorithm.entity';

export const PREDICTION_REPOSITORY_TOKEN = 'IPredictionRepository';

export interface IPredictionRepository {
  create(analysis: DomainPrediction): Promise<DomainPrediction>;
  save(analysis: DomainPrediction): Promise<void>;
  saveMany(analyses: DomainPrediction[]): Promise<void>;
  findAllByAlgorithmAndReliabilityIsNotNull(
    algorithm: DomainAlgorithm,
  ): Promise<DomainPrediction[]>;
  findByUser(visitorId?: string): Promise<DomainPrediction[]>;
  findWithoutAnalysisReliability(): Promise<DomainPrediction[]>;
  findRecentEpisodeByReliabilityIsNotZero(): Promise<{
    episode: number;
  } | null>;
  findBestByEpisodeAndAlgorithm(
    episode: number,
    algorithm: DomainAlgorithm,
  ): Promise<DomainPrediction | null>;
  findBestByEpisodeAndReliabilityIsNotNull(
    episode: number,
  ): Promise<DomainPrediction | null>;
  count(): Promise<number>;
  findAllSystemPredictions(): Promise<DomainPrediction[]>;
  findSystemPredictionKeys(): Promise<
    { episode: number; algorithmType: string }[]
  >;
  groupByAlgorithmTypeHavingEpisode(episode: number): Promise<any>;
}
