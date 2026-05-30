import { AlgorithmType, hacttoExecute } from '@hactto/algorithm';
import { DomainPrediction } from '../aggregates/prediction.entity';

export class AlgorithmExecutor {
  static async execute(
    type: AlgorithmType,
    episode: number,
    data: number[][],
    visitorId?: string,
    weights?: number[],
  ): Promise<DomainPrediction> {
    if (!weights) weights = [25, 20, 15, 15, 10, 10, 5];
    const result: number[] = await hacttoExecute(type, data, weights);
    return new DomainPrediction(
      type,
      episode,
      weights,
      result,
      undefined,
      visitorId,
    );
  }
}
