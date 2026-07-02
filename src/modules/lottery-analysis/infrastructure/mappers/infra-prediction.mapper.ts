import {
  Algorithm,
  Analysis,
  Prediction,
} from '../../../../generated/prisma/client';
import { DomainPrediction } from '../../domain/aggregates/prediction.entity';
import { DomainAnalysis } from '../../domain/aggregates/analysis.entity';
import { InfraAlgorithmMapper } from './infra-algorithm.mapper';

export class InfraPredictionMapper {
  static toEntity(
    raw: Prediction & {
      algorithm: Algorithm;
      analysis: Analysis;
    },
  ): DomainPrediction {
    let numbersArray = [0, 0, 0, 0, 0, 0];
    try {
      if (raw.numbers) {
        const parsed = JSON.parse(raw.numbers);
        numbersArray = [
          parsed['1st'] ?? 0,
          parsed['2nd'] ?? 0,
          parsed['3rd'] ?? 0,
          parsed['4th'] ?? 0,
          parsed['5th'] ?? 0,
          parsed['6th'] ?? 0,
        ];
      }
    } catch (e) {
      console.warn(`Failed to parse prediction numbers for id ${raw.id}:`, e);
    }

    let domainAnalysis: DomainAnalysis = new DomainAnalysis(
      raw.analysis.reliability,
      raw.analysis.sum,
      raw.analysis.cnt0s,
      raw.analysis.cnt10s,
      raw.analysis.cnt20s,
      raw.analysis.cnt30s,
      raw.analysis.cnt40s,
      raw.analysis.sumLastDigits,
      JSON.parse(raw.analysis.lastDigit0),
      JSON.parse(raw.analysis.lastDigit1),
      JSON.parse(raw.analysis.lastDigit2),
      JSON.parse(raw.analysis.lastDigit3),
      JSON.parse(raw.analysis.lastDigit4),
      JSON.parse(raw.analysis.lastDigit5),
      JSON.parse(raw.analysis.lastDigit6),
      JSON.parse(raw.analysis.lastDigit7),
      JSON.parse(raw.analysis.lastDigit8),
      JSON.parse(raw.analysis.lastDigit9),
      raw.analysis.even,
      raw.analysis.odd,
      raw.analysis.hot,
      raw.analysis.warm,
      raw.analysis.cold,
      raw.analysis.low,
      raw.analysis.high,
      raw.analysis.ac,
      JSON.parse(raw.analysis.consecutive),
      raw.analysis.id,
    );

    return new DomainPrediction(
      InfraAlgorithmMapper.toEntity(raw.algorithm),
      raw.episode,
      JSON.parse(raw.weights),
      numbersArray,
      domainAnalysis,
      raw.id,
      raw.visitorId ?? undefined,
    );
  }

  static toPersistence(entity: DomainPrediction): Prediction {
    const rawNumbers: number[] = entity.getNumberArray();
    const mappedObject = {
      '1st': rawNumbers[0],
      '2nd': rawNumbers[1],
      '3rd': rawNumbers[2],
      '4th': rawNumbers[3],
      '5th': rawNumbers[4],
      '6th': rawNumbers[5],
    };
    return {
      id: entity.id as number,
      algorithmType: entity.algorithm.type,
      episode: entity.episode,
      weights: JSON.stringify(entity.weights.toValues()),
      numbers: JSON.stringify(mappedObject),
      visitorId: entity.visitorId ?? null,
      createdAt: new Date(),
    };
  }
}
