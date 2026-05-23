import { getAlgorithm } from '@hactto/algorithm';

export class AlgorithmService {
  constructor() {}

  allAlgorithmTypes(): string[] {
    return getAlgorithm();
  }
}
