import { AlgorithmResult as InfraAlgorithmResult } from '../../../../generated/prisma/client';
import { AlgorithmResult as EntityAlgorithmResult } from '../../domain/entities/algorithm-result.entity';
import { AlgorithmType } from '@hactto/algorithm';

export class InfraAlgorithmResultMapper {
  static toEntity(raw: InfraAlgorithmResult): EntityAlgorithmResult {
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
      console.warn(
        `Failed to parse algorithm result numbers for id ${raw.id}:`,
        e,
      );
    }
    return new EntityAlgorithmResult(
      raw.algorithm as AlgorithmType,
      raw.episode,
      numbersArray,
      raw.id,
      raw.ip ?? undefined,
      raw.visitorId ?? undefined,
    );
  }

  static toPersistence(entity: EntityAlgorithmResult): InfraAlgorithmResult {
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
      algorithm: entity.algorithm,
      episode: entity.episode,
      numbers: JSON.stringify(mappedObject),
      id: entity.id as number,
      ip: entity.ip ?? null,
      visitorId: entity.visitorId ?? null,
    };
  }
}
