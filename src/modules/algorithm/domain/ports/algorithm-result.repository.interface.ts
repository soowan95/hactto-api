import { AlgorithmResult } from '../entities/algorithm-result.entity';

export const ALGORITHM_RESULT_REPOSITORY_TOKEN = 'IAlgorithmResultRepository';

export interface IAlgorithmResultRepository {
  create(data: AlgorithmResult): Promise<AlgorithmResult>;
  findWithoutReliability(): Promise<AlgorithmResult[]>;
  count(): Promise<number>;
}
