import { AlgorithmType, hacttoExecute } from '@hactto/algorithm';
import { LottoNumberSet } from '../../../winning-number/domain/vos/lotto-number-set.vo';
import { Reliability } from '../../../../generated/prisma/client';

export class AlgorithmResult {
  public readonly algorithm: AlgorithmType;
  public readonly episode: number;
  public readonly numberSet: LottoNumberSet;
  public id?: number;
  public reliability?: Reliability;

  constructor(
    algorithm: AlgorithmType,
    episode: number,
    numbers: number[],
    id: number | undefined = undefined,
    reliability: Reliability | undefined = undefined,
  ) {
    this.algorithm = algorithm;
    this.episode = episode;
    this.numberSet = new LottoNumberSet(numbers);
    this.id = id;
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

  static async generate(
    type: AlgorithmType,
    episode: number,
    data: number[][],
  ): Promise<AlgorithmResult> {
    const result: number[] = await hacttoExecute(type, data);
    return new AlgorithmResult(type, episode, result);
  }
}
