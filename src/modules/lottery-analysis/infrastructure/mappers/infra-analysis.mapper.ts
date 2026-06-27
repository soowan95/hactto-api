import { Analysis } from '../../../../generated/prisma/client';
import { DomainAnalysis } from '../../domain/aggregates/analysis.entity';

export class InfraAnalysisMapper {
  static toEntity(raw: Analysis): DomainAnalysis {
    return new DomainAnalysis(
      raw.reliability,
      raw.sum,
      raw.cnt0s,
      raw.cnt10s,
      raw.cnt20s,
      raw.cnt30s,
      raw.cnt40s,
      raw.sumLastDigits,
      JSON.parse(raw.lastDigit0),
      JSON.parse(raw.lastDigit1),
      JSON.parse(raw.lastDigit2),
      JSON.parse(raw.lastDigit3),
      JSON.parse(raw.lastDigit4),
      JSON.parse(raw.lastDigit5),
      JSON.parse(raw.lastDigit6),
      JSON.parse(raw.lastDigit7),
      JSON.parse(raw.lastDigit8),
      JSON.parse(raw.lastDigit9),
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
      createdAt: new Date(),
    };
  }
}
