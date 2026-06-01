import { AggregateRoot } from '@nestjs/cqrs';
import { LottoNumberSet } from '../../../winning-number/domain/vos/lotto-number-set.vo';
import { DomainReliability } from './reliability.entity';
import { DomainWinningNumber } from '../../../winning-number/domain/entities/winning-number.entity';
import { Weights } from './vos/weights.vo';
import { PredictionReliabilityCalculatedEvent } from '../events/prediction-reliability-calculated.event';
import { DomainAlgorithm } from './algorithm.entity';

export class DomainPrediction extends AggregateRoot {
  public id?: number;
  public readonly algorithm: DomainAlgorithm;
  public readonly episode: number;
  public readonly weights: Weights;
  public readonly numberSet: LottoNumberSet;
  public readonly visitorId?: string;
  public reliability?: DomainReliability;

  constructor(
    algorithm: DomainAlgorithm,
    episode: number,
    weights: number[],
    numbers: number[],
    id?: number,
    visitorId?: string,
    reliability?: DomainReliability,
  ) {
    super();
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

  getWeights(): number[] {
    return this.weights.toValues();
  }

  calculateReliability(
    winningNumber: DomainWinningNumber,
    customWeights?: number[],
  ): void {
    if (!this.isNonZero()) {
      this.reliability = new DomainReliability(this.getId(), -1);
      this.apply(
        new PredictionReliabilityCalculatedEvent(
          this.getId(),
          this.episode,
          this.visitorId,
          -1,
        ),
      );
      return;
    }

    const WEIGHTS = customWeights || Array(6).fill(100 / 6);
    let score = 0;

    const winningNumbers = winningNumber.getNumberArray();
    const predictedNumbers = this.getNumberArray();

    for (let i = 0; i < 6; i++) {
      if (winningNumbers[i] === 0) continue;
      const distance = Math.abs(winningNumbers[i] - predictedNumbers[i]);
      score += WEIGHTS[i] / (1 + distance);
    }

    const finalScore = Math.round(score * 100) / 100;

    this.reliability = new DomainReliability(this.getId(), finalScore);
    this.apply(
      new PredictionReliabilityCalculatedEvent(
        this.getId(),
        this.episode,
        this.visitorId,
        finalScore,
      ),
    );
  }
}
