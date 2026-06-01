import {
  ExecutableCommand,
  FrequencyCommand,
  FrequencyType,
  hacttoExecute,
  WeightsCommand,
  WeightsType,
} from '@hactto/algorithm';
import { DomainPrediction } from '../aggregates/prediction.entity';
import { DomainAlgorithm } from '../aggregates/algorithm.entity';

export class AlgorithmExecutor {
  static async execute(
    algorithm: DomainAlgorithm,
    episode: number,
    data: number[][],
    visitorId?: string,
    weights?: number[],
  ): Promise<DomainPrediction> {
    if (!weights) weights = [25, 20, 18, 15, 12, 10];
    let command: ExecutableCommand;
    if (algorithm.type.includes('FREQUENCY'))
      command = new FrequencyCommand(algorithm.type as FrequencyType, data);
    else
      command = new WeightsCommand(
        algorithm.type as WeightsType,
        data,
        weights,
      );
    const result: number[] = await hacttoExecute(command);
    return new DomainPrediction(
      algorithm,
      episode,
      weights,
      result,
      undefined,
      visitorId,
    );
  }
}
