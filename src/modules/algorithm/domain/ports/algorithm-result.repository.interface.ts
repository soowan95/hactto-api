import { AlgorithmResult } from '../entities/algorithm-result.entity';

export const ALGORITHM_RESULT_REPOSITORY_TOKEN = 'IAlgorithmResultRepository';

export interface IAlgorithmResultRepository {
  create(algorithmResult: AlgorithmResult): Promise<AlgorithmResult>;
  findWithoutReliability(): Promise<AlgorithmResult[]>;
  findByUser(ip?: string, visitorId?: string): Promise<AlgorithmResult[]>;
  count(): Promise<number>;
}
