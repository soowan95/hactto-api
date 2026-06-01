import {
  Algorithm,
  Prediction,
  Reliability,
} from '../../../../generated/prisma/client';
import { DomainPrediction } from '../../domain/aggregates/prediction.entity';
import { DomainReliability } from '../../domain/aggregates/reliability.entity';
import { InfraAlgorithmMapper } from './infra-algorithm.mapper';

export class InfraPredictionMapper {
  static toEntity(
    raw: Prediction & {
      algorithm: Algorithm;
      reliability?: Reliability | null;
    },
  ): DomainPrediction {
    let numbersArray = [0, 0, 0, 0, 0, 0, 0];
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
          parsed['bns'] ?? 0,
        ];
      }
    } catch (e) {
      console.warn(`Failed to parse prediction numbers for id ${raw.id}:`, e);
    }

    let domainReliability: DomainReliability | undefined = undefined;
    if (raw.reliability) {
      domainReliability = new DomainReliability(
        raw.reliability.id,
        raw.reliability.score,
      );
    }

    return new DomainPrediction(
      InfraAlgorithmMapper.toEntity(raw.algorithm),
      raw.episode,
      JSON.parse(raw.weights),
      numbersArray,
      raw.id,
      raw.visitorId ?? undefined,
      domainReliability,
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
      bns: rawNumbers[6],
    };
    return {
      id: entity.id as number,
      algorithmType: entity.algorithm.type,
      episode: entity.episode,
      weights: JSON.stringify(entity.weights.toValues()),
      numbers: JSON.stringify(mappedObject),
      visitorId: entity.visitorId ?? null,
    };
  }
}
