import { Reliability } from '../../../../generated/prisma/client';
import { DomainReliability } from '../../domain/entities/reliability.entity';

export class InfraReliabilityMapper {
  static toEntity(raw: Reliability): DomainReliability {
    return new DomainReliability(
      raw.id,
      raw.score,
    );
  }

  static toPersistence(entity: DomainReliability): Reliability {
    return {
      id: entity.id,
      score: entity.score.getScore(),
    };
  }
}
