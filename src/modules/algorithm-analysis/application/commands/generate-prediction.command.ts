import { AlgorithmType } from '@hactto/algorithm';

export class GeneratePredictionCommand {
  constructor(
    public readonly type: AlgorithmType,
    public readonly visitorId?: string,
    public readonly weights?: number[],
  ) {}
}
