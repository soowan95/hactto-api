import { AlgorithmType } from '@hactto/algorithm';
import { DomainReliability } from '../entities/reliability.entity';

export const RELIABILITY_REPOSITORY_TOKEN = 'IReliabilityRepository';

export interface IReliabilityRepository {
  createMany(dataList: DomainReliability[]): Promise<void>;
  getAverageScore(algorithm?: AlgorithmType): Promise<number>;
  upsert(reliability: DomainReliability): Promise<void>;
}
