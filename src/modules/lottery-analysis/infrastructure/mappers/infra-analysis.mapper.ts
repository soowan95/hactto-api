import { Analysis } from '../../../../generated/prisma/client';
import { DomainAnalysis } from '../../domain/aggregates/analysis.entity';

export class InfraAnalysisMapper {
  static toEntity(raw: Analysis): DomainAnalysis {
    return new DomainAnalysis(
      raw.reliability,
      raw.even,
      raw.odd,
      raw.hot,
      raw.warm,
      raw.cold,
      raw.low,
      raw.high,
      raw.ac,
      JSON.parse(raw.consecutive),
      raw.id,
    );
  }

  static toPersistence(entity: DomainAnalysis): Analysis {
    return {
      id: entity.id as number,
      ...entity,
      reliability: entity.reliability.getScore(),
      consecutive: JSON.stringify(entity.consecutive),
    };
  }
}
