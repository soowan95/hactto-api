import { WinningNumber as InfraWinningNumber } from '../../../../generated/prisma/client';
import { WinningNumber as EntityWinningNumber } from '../../domain/entities/winning-number.entity';

export class InfraWinningNumberMapper {
  static toEntity(raw: InfraWinningNumber): EntityWinningNumber {
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
    return new EntityWinningNumber(raw.episode, numbersArray, raw.isDrawn);
  }

  static toPersistence(entity: EntityWinningNumber): InfraWinningNumber {
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
      episode: entity.episode,
      numbers: JSON.stringify(mappedObject),
      isDrawn: entity.isDrawn,
    };
  }
}
