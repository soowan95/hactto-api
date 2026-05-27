import { WinningNumber as InfraWinningNumber } from '../../../../generated/prisma/client';
import { WinningNumber as EntityWinningNumber } from '../../domain/entities/winning-number.entity';

export class InfraWinningNumberMapper {
  static toEntity(raw: InfraWinningNumber): EntityWinningNumber {
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
      console.warn(`Failed to parse numbers for episode ${raw.episode}:`, e);
    }
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
