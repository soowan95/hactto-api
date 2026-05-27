import { AlgorithmType } from '@hactto/algorithm';
import { LottoNumberSet } from '../../../winning-number/domain/vos/lotto-number-set.vo';

export class DomainAlgorithmResult {
  public readonly algorithm: AlgorithmType;
  public readonly episode: number;
  public readonly numberSet: LottoNumberSet;
  public readonly visitorId?: string;
  public readonly personalWeightId?: number;
  public id?: number;

  constructor(
    algorithm: AlgorithmType,
    episode: number,
    numbers: number[],
    id: number | undefined = undefined,
    visitorId?: string,
    personalWeightId?: number,
  ) {
    this.algorithm = algorithm;
    this.episode = episode;
    this.numberSet = new LottoNumberSet(numbers);
    this.id = id;
    this.visitorId = visitorId;
    this.personalWeightId = personalWeightId;
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
}
