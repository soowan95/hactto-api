import { AlgorithmType, hacttoExecute } from '@hactto/algorithm';
import { DomainAlgorithmResult } from '../entities/algorithm-result.entity';
import { DomainPersonalWeight } from '../../../personal-weight/domain/entities/personal-weight.entity';

export class AlgorithmExecutor {
  static async execute(
    type: AlgorithmType,
    episode: number,
    data: number[][],
    visitorId?: string,
    personalWeight?: DomainPersonalWeight,
  ) {
    const result: number[] = await hacttoExecute(
      type,
      data,
      personalWeight?.weights?.toValues() || [25, 20, 15, 15, 10, 10, 5],
    );
    return new DomainAlgorithmResult(
      type,
      episode,
      result,
      undefined,
      visitorId,
      personalWeight?.id,
    );
  }
}
