import { Reliability as InfraReliability } from '../../../../generated/prisma/client';
import { Reliability as EntityReliability } from '../../domain/entities/reliability.entity';

export class InfraReliabilityMapper {
  static toEntity(raw: InfraReliability): EntityReliability {
    return new EntityReliability(raw.id, raw.score);
  }

  static toPersistence(entity: EntityReliability): InfraReliability {
    return {
      id: entity.id,
      score: entity.score.getScore(),
    };
  }
}
