import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { AnalyzeCommand } from '../commands/analyze.command';
import { Inject, Logger } from '@nestjs/common';
import {
  IPredictionRepository,
  PREDICTION_REPOSITORY_TOKEN,
} from '../../domain/ports/prediction.port';
import {
  WINNING_NUMBER_READER_TOKEN,
  WinningNumberReader,
} from '../../domain/ports/winning-number-reader.port';
import { DomainPrediction } from '../../domain/aggregates/prediction.entity';
import { AnalysisWinningNumber } from '../../domain/aggregates/winning-number.entity';
import { AlgorithmExecutor } from '../../domain/services/algorithm-executor';

import { SystemStatusService } from '../../../../common/services/system-status.service';
import {
  ALGORITHM_REPOSITORY_TOKEN,
  IAlgorithmRepository,
} from '../../domain/ports/algorithm.port';
import { RedisService } from '../../../../helpers/redis/application/redis.service';
import { DomainAlgorithm } from '../../domain/aggregates/algorithm.entity';
import {
  BALL_STATUS_READER_TOKEN,
  BallStatusReader,
} from '../../domain/ports/ball-status-reader.port';

@CommandHandler(AnalyzeCommand)
export class AnalyzeHandler implements ICommandHandler<AnalyzeCommand> {
  private readonly logger = new Logger(AnalyzeHandler.name);

  constructor(
    @Inject(PREDICTION_REPOSITORY_TOKEN)
    private readonly predictionRepository: IPredictionRepository,
    @Inject(WINNING_NUMBER_READER_TOKEN)
    private readonly winningNumberReader: WinningNumberReader,
    @Inject(ALGORITHM_REPOSITORY_TOKEN)
    private readonly algorithmRepository: IAlgorithmRepository,
    @Inject(BALL_STATUS_READER_TOKEN)
    private readonly ballStatusReader: BallStatusReader,
    private readonly publisher: EventPublisher,
    private readonly systemStatusService: SystemStatusService,
    private readonly redisService: RedisService,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(command: AnalyzeCommand): Promise<void> {
    try {
      // Always initialize algorithms (new episodes will be processed dynamically)
      await this.initializeAlgorithms();

      const targetPredictions: DomainPrediction[] =
        await this.predictionRepository.findWithoutAnalysisReliability();

      const resultsToSave: DomainPrediction[] = [];

      for (const result of targetPredictions) {
        const winningNumber: AnalysisWinningNumber | null =
          await this.winningNumberReader.findByEpisode(result.episode);
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

    const winningNumbers: AnalysisWinningNumber[] =
      await this.winningNumberReader.findAll({
        orderByEpisode: 'asc',
      });
    const data: number[][] = winningNumbers.map(
      (winningNumber) => winningNumber.numbers,
    );

    const existingPredictions =
      await this.predictionRepository.findAllSystemPredictions();
    const existingSet = new Set<string>();
    for (const p of existingPredictions) {
      existingSet.add(`${p.episode}:${p.algorithm.type}`);
    }

    const predictionsToCreate: DomainPrediction[] = [];

    for (const algorithm of algorithms) {
      for (let i = 1; i < data.length; i++) {
        const episode = i + 1;
        const key = `${episode}:${algorithm.type}`;

        if (existingSet.has(key)) {
          continue;
        }

        const subData: number[][] = data.slice(0, i);
        const executed = await AlgorithmExecutor.execute(
          algorithm,
          episode,
          subData,
          undefined,
          undefined,
          this.ballStatusReader,
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
