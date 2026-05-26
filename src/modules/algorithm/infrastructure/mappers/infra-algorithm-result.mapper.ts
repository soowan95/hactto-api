import { AlgorithmResult as InfraAlgorithmResult } from '../../../../generated/prisma/client';
import { AlgorithmResult as EntityAlgorithmResult } from '../../domain/entities/algorithm-result.entity';
import { AlgorithmType } from '@hactto/algorithm';

export class InfraAlgorithmResultMapper {
  static toEntity(raw: InfraAlgorithmResult): EntityAlgorithmResult {
    const parsed = JSON.parse(raw.numbers);
    const numbersArray = [
      parsed['1st'],
      parsed['2nd'],
      parsed['3rd'],
      parsed['4th'],
      parsed['5th'],
      parsed['6th'],
      parsed['bns'],
    ];
    return new EntityAlgorithmResult(
      raw.algorithm as AlgorithmType,
      raw.episode,
      numbersArray,
      raw.id,
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
    };
  }
}
