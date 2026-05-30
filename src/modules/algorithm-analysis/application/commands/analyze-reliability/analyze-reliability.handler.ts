import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AnalyzeReliabilityCommand } from './analyze-reliability.command';
import { Inject, Logger } from '@nestjs/common';
import {
  ALGORITHM_ANALYSIS_REPOSITORY_TOKEN,
  IAlgorithmAnalysisRepository,
} from '../../../domain/ports/algorithm-analysis.repository.interface';
import {
  WINNING_NUMBER_REPOSITORY_TOKEN,
  IWinningNumberRepository,
} from '../../../../winning-number/domain/ports/winning-number.repository.interface';
import { DomainPrediction } from '../../../domain/aggregates/prediction.entity';
import { DomainWinningNumber } from '../../../../winning-number/domain/entities/winning-number.entity';
import { AlgorithmType, getAlgorithm } from '@hactto/algorithm';
import { AlgorithmExecutor } from '../../../domain/services/algorithm-executor';
import { RedisService } from '../../../../../helpers/redis/redis.service';

@CommandHandler(AnalyzeReliabilityCommand)
export class AnalyzeReliabilityHandler implements ICommandHandler<AnalyzeReliabilityCommand> {
  private readonly logger = new Logger(AnalyzeReliabilityHandler.name);

  constructor(
    @Inject(ALGORITHM_ANALYSIS_REPOSITORY_TOKEN)
    private readonly repository: IAlgorithmAnalysisRepository,
    @Inject(WINNING_NUMBER_REPOSITORY_TOKEN)
    private readonly winningNumberRepository: IWinningNumberRepository,
    private readonly redisService: RedisService,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(command: AnalyzeReliabilityCommand): Promise<void> {
    const isExistAtLeastOneAlgorithmResult: boolean =
      (await this.repository.count()) > 0;

    this.logger.debug(
      `Algorithm result exists: `,
      isExistAtLeastOneAlgorithmResult,
    );

    if (!isExistAtLeastOneAlgorithmResult) {
      await this.initializeAlgorithms();
    }

    const targetPredictions: DomainPrediction[] =
      await this.repository.findWithoutReliability();

    const resultsToSave: DomainPrediction[] = [];

    for (const result of targetPredictions) {
      const winningNumber: DomainWinningNumber =
        await this.winningNumberRepository.findByEpisode(result.episode);
      if (!winningNumber || !winningNumber.isDrawn) continue;

      result.calculateReliability(winningNumber, result.weights.toValues());
      resultsToSave.push(result);
    }

    if (resultsToSave.length > 0) {
      await this.repository.saveMany(resultsToSave);

      // 사용자 예측 이력 캐시 무효화
      const visitorIds = Array.from(
        new Set(
          resultsToSave
            .map((r) => r.visitorId)
            .filter((id): id is string => !!id && id !== 'guest'),
        ),
      );
      for (const visitorId of visitorIds) {
        await this.redisService.del(`user:${visitorId}:predictions:history`);
      }
    }

    // 캐시 무효화
    await this.redisService.del('algorithm:all:average-reliability');
    const types = getAlgorithm();
    for (const type of types) {
      await this.redisService.del(`algorithm:${type}:average-reliability`);
    }
  }

  private async initializeAlgorithms(): Promise<void> {
    this.logger.debug(`Initializing algorithms.`);
    const types: AlgorithmType[] = getAlgorithm();
    const winningNumbers: DomainWinningNumber[] =
      await this.winningNumberRepository.findAll();
    const data: number[][] = winningNumbers.map((winningNumber) =>
      winningNumber.getNumberArray(),
    );

    for (const type of types) {
      for (let i = 1; i < data.length; i++) {
        const subData: number[][] = data.slice(0, i);
        const executed = await AlgorithmExecutor.execute(type, i + 1, subData);
        await this.repository.create(executed);
      }
    }
  }
}
