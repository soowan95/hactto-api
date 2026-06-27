import {
  BalanceCommand,
  BalanceType,
  ExecutableCommand,
  FrequencyCommand,
  FrequencyType,
  hacttoExecute,
  WeightsCommand,
  WeightsType,
} from '@hactto95/algorithm';
import { DomainPrediction } from '../aggregates/prediction.entity';
import { DomainAlgorithm } from '../aggregates/algorithm.entity';
import { DomainAnalysis } from '../aggregates/analysis.entity';
import { BallStatusReader } from '../ports/ball-status-reader.port';

export class AlgorithmExecutor {
  static async execute(
    algorithm: DomainAlgorithm,
    episode: number,
    data: number[][],
    visitorId?: string,
    weights?: number[],
    oddCount?: number,
    ballStatusReader?: BallStatusReader,
  ): Promise<DomainPrediction> {
    if (!weights) weights = [25, 20, 18, 15, 12, 10];
    if (!oddCount) oddCount = 3;
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
      case 'BALANCE':
        command = new BalanceCommand(
          algorithm.type as BalanceType,
          data,
          oddCount,
        );
        break;
      default:
        throw new Error(`Unsupported algorithm type: ${algorithm.type}`);
    }
    const result: number[] = await hacttoExecute(command);

    let temperatures;
    if (ballStatusReader) {
      temperatures = await ballStatusReader.getBallTemperatures(
        result,
        episode,
      );
    }

    return new DomainPrediction(
      algorithm,
      episode,
      weights,
      result,
      DomainAnalysis.create(result, temperatures),
      undefined,
      visitorId,
    );
  }
}
