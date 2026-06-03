import { AggregateRoot } from '@nestjs/cqrs';
import { LottoNumberSet } from '../../../number/domain/vos/lotto-number-set.vo';
import { DomainAnalysis } from './analysis.entity';
import { AnalysisWinningNumber } from './winning-number.entity';
import { Weights } from '../vos/weights.vo';
import { PredictionReliabilityCalculatedEvent } from '../events/prediction-reliability-calculated.event';
import { DomainAlgorithm } from './algorithm.entity';

export class DomainPrediction extends AggregateRoot {
  public id?: number;
  public readonly algorithm: DomainAlgorithm;
  public readonly episode: number;
  public readonly weights: Weights;
  public readonly numberSet: LottoNumberSet;
  public readonly visitorId?: string;
  public analysis?: DomainAnalysis;

  constructor(
    algorithm: DomainAlgorithm,
    episode: number,
    weights: number[],
    numbers: number[],
    id?: number,
    visitorId?: string,
    analysis?: DomainAnalysis,
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

  analyze(
    winningNumber: AnalysisWinningNumber,
    customWeights?: number[],
    temperatures?: Record<number, 'HOT' | 'WARM' | 'COLD'>,
  ): void {
    if (!this.isNonZero()) {
      this.analysis = DomainAnalysis.create(
        this.getId(),
        -1,
        this.getNumberArray(),
        temperatures,
      );
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

    const winningNumbers = winningNumber.numbers;
    const predictedNumbers = this.getNumberArray();

    for (let i = 0; i < 6; i++) {
      if (winningNumbers[i] === 0) continue;
      const distance = Math.abs(winningNumbers[i] - predictedNumbers[i]);
      score += WEIGHTS[i] / (1 + distance);
    }

    const finalScore = Math.round(score * 100) / 100;

    this.analysis = DomainAnalysis.create(
      this.getId(),
      finalScore,
      this.getNumberArray(),
      temperatures,
    );
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
