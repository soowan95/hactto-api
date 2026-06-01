import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { AnalyzeReliabilityCommand } from '../commands/analyze-reliability.command';
import { Inject, Logger } from '@nestjs/common';
import {
  IPredictionRepository,
  PREDICTION_REPOSITORY_TOKEN,
} from '../../domain/ports/prediction.repository.interface';
import {
  IWinningNumberRepository,
  WINNING_NUMBER_REPOSITORY_TOKEN,
} from '../../../winning-number/domain/ports/winning-number.repository.interface';
import { DomainPrediction } from '../../domain/aggregates/prediction.entity';
import { DomainWinningNumber } from '../../../winning-number/domain/entities/winning-number.entity';
import { AlgorithmExecutor } from '../../domain/services/algorithm-executor';

import { SystemStatusService } from '../../../../common/services/system-status.service';
import {
  ALGORITHM_REPOSITORY_TOKEN,
  IAlgorithmRepository,
} from '../../domain/ports/algorithm.repository.interface';
import { RedisService } from '../../../../helpers/redis/application/redis.service';
import { DomainAlgorithm } from '../../domain/aggregates/algorithm.entity';

@CommandHandler(AnalyzeReliabilityCommand)
export class AnalyzeReliabilityHandler implements ICommandHandler<AnalyzeReliabilityCommand> {
  private readonly logger = new Logger(AnalyzeReliabilityHandler.name);

  constructor(
    @Inject(PREDICTION_REPOSITORY_TOKEN)
    private readonly predictionRepository: IPredictionRepository,
    @Inject(WINNING_NUMBER_REPOSITORY_TOKEN)
    private readonly winningNumberRepository: IWinningNumberRepository,
    @Inject(ALGORITHM_REPOSITORY_TOKEN)
    private readonly algorithmRepository: IAlgorithmRepository,
    private readonly publisher: EventPublisher,
    private readonly systemStatusService: SystemStatusService,
    private readonly redisService: RedisService,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(command: AnalyzeReliabilityCommand): Promise<void> {
    try {
      const predictionCount = await this.predictionRepository.count();

      this.logger.debug(`Algorithm result exists: `, predictionCount);

      if (predictionCount <= 0) {
        await this.initializeAlgorithms();
      }

      const targetPredictions: DomainPrediction[] =
        await this.predictionRepository.findWithoutReliability();

      const resultsToSave: DomainPrediction[] = [];

      for (const result of targetPredictions) {
        const winningNumber: DomainWinningNumber =
          await this.winningNumberRepository.findByEpisode(result.episode);
        if (!winningNumber || !winningNumber.isDrawn) continue;

        const prediction = this.publisher.mergeObjectContext(result);
        prediction.calculateReliability(
          winningNumber,
          prediction.weights.toValues(),
        );

        resultsToSave.push(prediction);
      }

      if (resultsToSave.length > 0) {
        await this.predictionRepository.saveMany(resultsToSave);
        resultsToSave.forEach((prediction) => prediction.commit());
      }
    } finally {
      this.logger.debug(
        '🔓 Analysis processing completed. Releasing system lock.',
      );
      await this.systemStatusService.setAnalysisStatus(false);
    }
  }

  private async initializeAlgorithms(): Promise<void> {
    this.logger.debug(`Initializing algorithms.`);
    const cacheKey = 'algorithm:all';
    const cachedData = await this.redisService.get(cacheKey);
    let algorithms: DomainAlgorithm[];
    if (!cachedData) {
      algorithms = await this.algorithmRepository.findAll();
      await this.redisService.set(cacheKey, JSON.stringify(algorithms));
    } else algorithms = JSON.parse(cachedData);
    const winningNumbers: DomainWinningNumber[] =
      await this.winningNumberRepository.findAll();
    const data: number[][] = winningNumbers.map((winningNumber) =>
      winningNumber.getNumberArray(),
    );

    const predictionsToCreate: DomainPrediction[] = [];

    for (const algorithm of algorithms) {
      for (let i = 1; i < data.length; i++) {
        const subData: number[][] = data.slice(0, i);
        const executed = await AlgorithmExecutor.execute(
          algorithm,
          i + 1,
          subData,
        );
        predictionsToCreate.push(executed);
      }
    }

    if (predictionsToCreate.length > 0) {
      this.logger.debug(
        `Bulk inserting ${predictionsToCreate.length} predictions...`,
      );
      await this.predictionRepository.saveMany(predictionsToCreate);
    }
  }
}
