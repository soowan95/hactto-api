import { DomainAlgorithm } from '../aggregates/algorithm.entity';

export const ALGORITHM_REPOSITORY_TOKEN = 'IAlgorithmRepository';

export interface IAlgorithmRepository {
  findAll(): Promise<DomainAlgorithm[]>;
  findByType(type: string): Promise<DomainAlgorithm>;
  upsert(algorithm: DomainAlgorithm): Promise<void>;
  update(algorithm: DomainAlgorithm): Promise<DomainAlgorithm>;
}
