import { DomainAlgorithmResult } from '../../../algorithm/domain/entities/algorithm-result.entity';
import { DomainReliability } from '../entities/reliability.entity';
import { DomainWinningNumber } from '../../../winning-number/domain/entities/winning-number.entity';

export class ReliabilityCalculator {
  static calculate(
    winningNumber: DomainWinningNumber,
    result: DomainAlgorithmResult,
  ): DomainReliability {
    if (!result.isNonZero()) return new DomainReliability(result.getId(), -1);

    const WEIGHTS = [25, 20, 15, 15, 10, 10, 5];
    const maxScore = WEIGHTS.reduce((sum, weight) => sum + weight, 0);
    let score = 0;

    for (let i = 0; i < WEIGHTS.length; i++) {
      const distance = Math.abs(
        winningNumber.getNumberArray()[i] - result.getNumberArray()[i],
      );
      score += WEIGHTS[i] / (1 + distance);
    }

    const finalScore = Math.round((score / maxScore) * 100 * 100) / 100;

    return new DomainReliability(result.getId(), finalScore);
  }
}
