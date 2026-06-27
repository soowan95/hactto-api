import { Algorithm } from '../../../../generated/prisma/client';
import { DomainAlgorithm } from '../../domain/aggregates/algorithm.entity';

export class InfraAlgorithmMapper {
  static toEntity(raw: Algorithm): DomainAlgorithm {
    return new DomainAlgorithm(
      raw.type,
      raw.complexity,
      raw.name ?? undefined,
      raw.description ?? undefined,
    );
  }

  static toPersistence(entity: DomainAlgorithm): Algorithm {
    return {
      type: entity.type,
      name: entity.name ?? null,
      complexity: entity.complexity,
      description: entity.description ?? null,
    };
  }
}
