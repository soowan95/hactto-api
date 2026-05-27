import { PersonalWeight as RawPersonalWeight } from '../../../../generated/prisma/client';
import { DomainPersonalWeight } from '../../domain/entities/personal-weight.entity';
import { AlgorithmType } from '@hactto/algorithm';

export class InfraPersonalWeightMapper {
  static toEntity(raw: RawPersonalWeight): DomainPersonalWeight {
    const parsedWeights = JSON.parse(raw.weights) as number[];
    return new DomainPersonalWeight(
      raw.visitorId,
      raw.algorithm as AlgorithmType,
      parsedWeights,
      raw.id,
    );
  }

  static toPersistence(entity: DomainPersonalWeight): RawPersonalWeight {
    return {
      id: entity.id ?? 0,
      visitorId: entity.visitorId,
      algorithm: entity.algorithm,
      weights: JSON.stringify(entity.getWeightsArray()),
    };
  }
}
