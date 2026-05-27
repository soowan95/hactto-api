import { DomainWinningNumber } from '../entities/winning-number.entity';

export class WinningNumberResponseConvertor {
  static convertForShow(winningNumber: DomainWinningNumber) {
    return {
      episode: winningNumber.episode,
      numbers: winningNumber.getNumberArray(),
      isDrawn: winningNumber.isDrawn,
    };
  }
}
