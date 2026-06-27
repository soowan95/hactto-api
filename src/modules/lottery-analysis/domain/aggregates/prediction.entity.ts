import { AggregateRoot } from '@nestjs/cqrs';
import { LottoNumberSet } from '../../../number/domain/vos/lotto-number-set.vo';
import { DomainAnalysis } from './analysis.entity';
import { AnalysisWinningNumber } from './winning-number.entity';
import { Weights } from '../vos/weights.vo';
import { PredictionAnalyzedEvent } from '../events/prediction-analyzed.event';
import { DomainAlgorithm } from './algorithm.entity';

export class DomainPrediction extends AggregateRoot {
  public id?: number;
  public readonly algorithm: DomainAlgorithm;
  public readonly episode: number;
  public readonly weights: Weights;
  public readonly numberSet: LottoNumberSet;
  public readonly visitorId?: string;
  public analysis: DomainAnalysis;

  constructor(
    algorithm: DomainAlgorithm,
    episode: number,
    weights: number[],
    numbers: number[],
    analysis: DomainAnalysis,
    id?: number,
    visitorId?: string,
  ) {
    super();
    this.algorithm = algorithm;
    this.episode = episode;
    this.weights = new Weights(weights);
    this.numberSet = new LottoNumberSet(numbers);
    this.id = id;
    this.visitorId = visitorId;
    this.analysis = analysis;
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
    winningNumber: AnalysisWinningNumber,
    customWeights?: number[],
  ): void {
    if (!this.isNonZero()) {
      this.analysis.setReliability(-1);
      this.apply(new PredictionAnalyzedEvent(this.visitorId, this.analysis));
      return;
    }

    const WEIGHTS = customWeights || Array(6).fill(100 / 6);
    let score = 0;

    const winningNumbers = winningNumber.numbers;
    const predictedNumbers = this.getNumberArray();

    for (let i = 0; i < 6; i++) {
      if (winningNumbers[i] === 0) continue;
      const distance = Math.abs(winningNumbers[i] - predictedNumbers[i]);
      score += WEIGHTS[i] / (1 + distance);
    }

    const finalScore = Math.round(score * 10) / 10;

    this.analysis.setReliability(finalScore);
    this.apply(new PredictionAnalyzedEvent(this.visitorId, this.analysis));
  }
}
