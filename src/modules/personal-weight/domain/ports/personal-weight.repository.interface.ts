import { AlgorithmType } from '@hactto/algorithm';
import { DomainPersonalWeight } from '../entities/personal-weight.entity';

export const PERSONAL_WEIGHT_REPOSITORY_TOKEN = 'IPersonalWeightRepository';

export interface IPersonalWeightRepository {
  findByUserAndAlgorithm(
    visitorId: string,
    algorithm: AlgorithmType,
  ): Promise<DomainPersonalWeight | null>;
  create(personalWeight: DomainPersonalWeight): Promise<DomainPersonalWeight>;
  findById(id: number): Promise<DomainPersonalWeight | null>;
}
