import { WinningNumber } from '../../../../generated/prisma/client';
import { DomainWinningNumber } from '../../domain/aggregates/winning-number.entity';

export class InfraWinningNumberMapper {
  static toEntity(raw: WinningNumber): DomainWinningNumber {
    const numbersArray = [
      raw.lt1WnNo,
      raw.lt2WnNo,
      raw.lt3WnNo,
      raw.lt4WnNo,
      raw.lt5WnNo,
      raw.lt6WnNo,
      raw.ltBnsWnNo,
    ];
    return new DomainWinningNumber(raw.episode, numbersArray, raw.isDrawn);
  }

  static toPersistence(entity: DomainWinningNumber): WinningNumber {
    const rawNumbers: number[] = entity.getNumberArray();
    return {
      episode: entity.episode,
      lt1WnNo: rawNumbers[0],
      lt2WnNo: rawNumbers[1],
      lt3WnNo: rawNumbers[2],
      lt4WnNo: rawNumbers[3],
      lt5WnNo: rawNumbers[4],
      lt6WnNo: rawNumbers[5],
      ltBnsWnNo: rawNumbers[6],
      isDrawn: entity.isDrawn,
    };
  }
}
