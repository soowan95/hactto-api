import { Injectable } from '@nestjs/common';
import { DomainWinningNumber } from '../../../number/domain/aggregates/winning-number.entity';
import { AnalysisWinningNumber } from '../../domain/aggregates/winning-number.entity';

@Injectable()
export class WinningNumberMapper {
  toAnalysisModel(winningNumber: DomainWinningNumber): AnalysisWinningNumber {
    return new AnalysisWinningNumber(
      winningNumber.episode,
      winningNumber.getNumberArray(),
      winningNumber.isDrawn,
    );
  }
}
