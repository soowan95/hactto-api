import { DomainAlgorithmResult } from '../entities/algorithm-result.entity';

export const ALGORITHM_RESULT_REPOSITORY_TOKEN = 'IAlgorithmResultRepository';

export interface IAlgorithmResultRepository {
  create(
    algorithmResult: DomainAlgorithmResult,
  ): Promise<DomainAlgorithmResult>;
  findWithoutReliability(): Promise<DomainAlgorithmResult[]>;
  findByUser(visitorId?: string): Promise<DomainAlgorithmResult[]>;
  count(): Promise<number>;
  updatePersonalWeight(id: number, personalWeightId: number): Promise<void>;
}
