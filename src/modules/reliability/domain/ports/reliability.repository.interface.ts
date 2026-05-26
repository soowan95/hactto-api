import { AlgorithmType } from '@hactto/algorithm';
import { Reliability } from '../entities/reliability.entity';

export const RELIABILITY_REPOSITORY_TOKEN = 'IReliabilityRepository';

export interface IReliabilityRepository {
  createMany(dataList: Reliability[]): Promise<void>;
  getAverageScore(algorithm?: AlgorithmType): Promise<number>;
}
