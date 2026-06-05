import { WinningNumber } from '../../../../generated/prisma/client';
import { DomainWinningNumber } from '../../domain/aggregates/winning-number.entity';

export class InfraWinningNumberMapper {
  static toEntity(raw: any): DomainWinningNumber {
    const numbersArray = [
      raw.lt1WnNo,
      raw.lt2WnNo,
      raw.lt3WnNo,
      raw.lt4WnNo,
      raw.lt5WnNo,
      raw.lt6WnNo,
      raw.ltBnsWnNo,
    ];
    const entity = new DomainWinningNumber(
      raw.episode,
      numbersArray,
      raw.isDrawn,
    );
    if (raw.winningNumberAnalysis?.analysis) {
      const a = raw.winningNumberAnalysis.analysis;
      entity.analysis = {
        id: a.id,
        reliability: a.reliability,
        sum: a.sum,
        cnt0s: a.cnt0s,
        cnt10s: a.cnt10s,
        cnt20s: a.cnt20s,
        cnt30s: a.cnt30s,
        cnt40s: a.cnt40s,
        sumLastDigits: a.sumLastDigits,
        lastDigit0: JSON.parse(a.lastDigit0),
        lastDigit1: JSON.parse(a.lastDigit1),
        lastDigit2: JSON.parse(a.lastDigit2),
        lastDigit3: JSON.parse(a.lastDigit3),
        lastDigit4: JSON.parse(a.lastDigit4),
        lastDigit5: JSON.parse(a.lastDigit5),
        lastDigit6: JSON.parse(a.lastDigit6),
        lastDigit7: JSON.parse(a.lastDigit7),
        lastDigit8: JSON.parse(a.lastDigit8),
        lastDigit9: JSON.parse(a.lastDigit9),
        even: a.even,
        odd: a.odd,
        hot: a.hot,
        warm: a.warm,
        cold: a.cold,
        low: a.low,
        high: a.high,
        ac: a.ac,
        consecutive: JSON.parse(a.consecutive),
      };
    }
    return entity;
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
