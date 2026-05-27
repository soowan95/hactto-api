import { AlgorithmType, hacttoExecute } from '@hactto/algorithm';
import { DomainAlgorithmResult } from '../entities/algorithm-result.entity';

export class AlgorithmExecutor {
  static async execute(
    type: AlgorithmType,
    episode: number,
    data: number[][],
    visitorId?: string,
    personalWeightId?: number,
  ) {
    const result: number[] = await hacttoExecute(type, data);
    return new DomainAlgorithmResult(
      type,
      episode,
      result,
      undefined,
      visitorId,
      personalWeightId,
    );
  }
}
