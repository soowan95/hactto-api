import { AlgorithmType } from '@hactto/algorithm';
import { LottoNumberSet } from '../../../winning-number/domain/vos/lotto-number-set.vo';
import { DomainReliability } from './reliability.entity';
import { DomainWinningNumber } from '../../../winning-number/domain/entities/winning-number.entity';
import { Weights } from './vos/weights.vo';

export class DomainPrediction {
  public id?: number;
  public readonly algorithm: AlgorithmType;
  public readonly episode: number;
  public readonly weights: Weights;
  public readonly numberSet: LottoNumberSet;
  public readonly visitorId?: string;
  public reliability?: DomainReliability;

  constructor(
    algorithm: AlgorithmType,
    episode: number,
    weights: number[],
    numbers: number[],
    id?: number,
    visitorId?: string,
    reliability?: DomainReliability,
  ) {
    this.algorithm = algorithm;
    this.episode = episode;
    this.weights = new Weights(weights);
    this.numberSet = new LottoNumberSet(numbers);
    this.id = id;
    this.visitorId = visitorId;
    this.reliability = reliability;
  }

  getId(): number {
    return this.id as number;
  }

  isNonZero(): boolean {
    return this.numberSet.isNonZero();
  }

  getNumberArray(): number[] {
    return this.numberSet.toValues();
  }

  calculateReliability(
    winningNumber: DomainWinningNumber,
    customWeights?: number[],
  ): void {
    if (!this.isNonZero()) {
      this.reliability = new DomainReliability(this.getId(), -1);
      return;
    }

    const WEIGHTS = customWeights || [25, 20, 15, 15, 10, 10, 5];
    const maxScore = WEIGHTS.reduce((sum, weight) => sum + weight, 0);
    let score = 0;

    const winningNumbers = winningNumber.getNumberArray();
    const predictedNumbers = this.getNumberArray();

    for (let i = 0; i < WEIGHTS.length; i++) {
      const distance = Math.abs(winningNumbers[i] - predictedNumbers[i]);
      score += WEIGHTS[i] / (1 + distance);
    }

    const finalScore = Math.round((score / maxScore) * 100 * 100) / 100;

    this.reliability = new DomainReliability(this.getId(), finalScore);
  }
}
