import { AlgorithmType } from '@hactto/algorithm';

export class GetAlgorithmReliabilityHistoryQuery {
  constructor(public readonly algorithm: AlgorithmType) {}
}
