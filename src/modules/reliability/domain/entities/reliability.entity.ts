import { WinningNumber } from '../../../winning-number/domain/entities/winning-number.entity';
import { AlgorithmResult } from '../../../algorithm/domain/entities/algorithm-result.entity';
import { ReliabilityScore } from '../vos/reliability-score.vo';

export class Reliability {
  public readonly id: number;
  public readonly score: ReliabilityScore;
  constructor(id: number, score: number) {
    this.id = id;
    this.score = new ReliabilityScore(score);
  }

  static calculate(
    winningNumber: WinningNumber,
    result: AlgorithmResult,
  ): Reliability {
    if (!result.isNonZero()) return new Reliability(result.getId(), -1);

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

    return new Reliability(result.getId(), finalScore);
  }
}
