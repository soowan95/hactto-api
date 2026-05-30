import { AlgorithmType } from '@hactto/algorithm';

export class GetPersonalWeightQuery {
  constructor(
    public readonly visitorId: string,
    public readonly algorithm: AlgorithmType,
  ) {}
}
