import { AlgorithmType, hacttoExecute } from '@hactto/algorithm';
import { LottoNumberSet } from '../../../winning-number/domain/vos/lotto-number-set.vo';

export class AlgorithmResult {
  public readonly algorithm: AlgorithmType;
  public readonly episode: number;
  public readonly numberSet: LottoNumberSet;
  public readonly ip?: string;
  public readonly visitorId?: string;
  public id?: number;

  constructor(
    algorithm: AlgorithmType,
    episode: number,
    numbers: number[],
    id: number | undefined = undefined,
    ip?: string,
    visitorId?: string,
  ) {
    this.algorithm = algorithm;
    this.episode = episode;
    this.numberSet = new LottoNumberSet(numbers);
    this.id = id;
    this.ip = ip;
    this.visitorId = visitorId;
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
    ip?: string,
    visitorId?: string,
  ): Promise<AlgorithmResult> {
    const result: number[] = await hacttoExecute(type, data);
    return new AlgorithmResult(type, episode, result, undefined, ip, visitorId);
  }
}
