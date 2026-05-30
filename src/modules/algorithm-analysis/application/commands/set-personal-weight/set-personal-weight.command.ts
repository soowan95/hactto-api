import { AlgorithmType } from '@hactto/algorithm';

export class SetPersonalWeightCommand {
  constructor(
    public readonly visitorId: string,
    public readonly algorithm: AlgorithmType,
    public readonly weights: number[],
  ) {}
}
