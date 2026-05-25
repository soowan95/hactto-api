import { AlgorithmType } from '@hactto/algorithm';

export const RELIABILITY_REPOSITORY_TOKEN = 'IReliabilityRepository';

export interface IReliabilityRepository {
  createMany(dataList: { id: number; score: number }[]): Promise<void>;
  getAverageScore(algorithm?: AlgorithmType): Promise<number>;
}
