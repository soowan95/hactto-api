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
    const parts = algorithm.type.split('_');
    const suffix = parts[parts.length - 1];
    switch (suffix) {
      case 'WEIGHTS':
        command = new WeightsCommand(
          algorithm.type as WeightsType,
          data,
          weights,
        );
        break;
      case 'FREQUENCY':
        command = new FrequencyCommand(algorithm.type as FrequencyType, data);
        break;
      default:
        throw new Error(`Unsupported algorithm type: ${algorithm.type}`);
    }
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
