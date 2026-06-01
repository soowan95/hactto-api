import { Algorithm } from '../../../../generated/prisma/client';
import { DomainAlgorithm } from '../../domain/aggregates/algorithm.entity';

export class InfraAlgorithmMapper {
  static toEntity(raw: Algorithm): DomainAlgorithm {
    return new DomainAlgorithm(raw.type, raw.complexity);
  }

  static toPersistence(entity: DomainAlgorithm): Algorithm {
    return {
      ...entity,
    };
  }
}
