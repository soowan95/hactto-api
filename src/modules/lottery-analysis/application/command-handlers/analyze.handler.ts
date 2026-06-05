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

import { SystemStatusService } from '../../../../common/utils/system-status/system-status.service';
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
import {
  ANALYSIS_REPOSITORY_TOKEN,
  IAnalysisRepository,
} from '../../domain/ports/analysis.port';
import {
  WINNING_NUMBER_ANALYSIS_REPOSITORY_TOKEN,
  IWinningNumberAnalysisRepository,
} from '../../domain/ports/winning-number-analysis.port';
import { DomainWinningNumberAnalysis } from '../../domain/aggregates/winning-number-analysis.entity';
import { DomainAnalysis } from '../../domain/aggregates/analysis.entity';

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
    @Inject(ANALYSIS_REPOSITORY_TOKEN)
    private readonly analysisRepository: IAnalysisRepository,
    @Inject(WINNING_NUMBER_ANALYSIS_REPOSITORY_TOKEN)
    private readonly winningNumberAnalysisRepository: IWinningNumberAnalysisRepository,
    private readonly publisher: EventPublisher,
    private readonly systemStatusService: SystemStatusService,
    private readonly redisService: RedisService,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(command: AnalyzeCommand): Promise<void> {
    try {
      // 1. Initialize winning number analyses first
      await this.initializeWinningNumberAnalyses();

      // 2. Always initialize algorithms (new episodes will be processed dynamically)
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

  private async initializeWinningNumberAnalyses(): Promise<void> {
    this.logger.debug(`Initializing winning number analyses.`);
    const winningNumbersToAnalyze =
      await this.winningNumberReader.findWithoutAnalysis();
    if (winningNumbersToAnalyze.length === 0) {
      this.logger.debug(`No new winning numbers to analyze.`);
      return;
    }

    this.logger.debug(
      `Found ${winningNumbersToAnalyze.length} winning numbers to analyze.`,
    );

    const batchSize = 10;
    const accumulatedWinningNumberAnalyses: DomainWinningNumberAnalysis[] = [];

    for (let i = 0; i < winningNumbersToAnalyze.length; i += batchSize) {
      const batch = winningNumbersToAnalyze.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (wn) => {
          const temperatures = await this.ballStatusReader.getBallTemperatures(
            wn.numbers,
            wn.episode,
          );
          const analysis = DomainAnalysis.create(wn.numbers, temperatures);
          const savedAnalysis = await this.analysisRepository.insert(analysis);
          return new DomainWinningNumberAnalysis(wn.episode, savedAnalysis.id!);
        }),
      );
      accumulatedWinningNumberAnalyses.push(...batchResults);
    }

    if (accumulatedWinningNumberAnalyses.length > 0) {
      this.logger.debug(
        `Saving ${accumulatedWinningNumberAnalyses.length} winning number analyses...`,
      );
      await this.winningNumberAnalysisRepository.createMany(
        accumulatedWinningNumberAnalyses,
      );
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

    const CONCURRENCY = 100;

    for (const algorithm of algorithms) {
      const episodes: { episode: number; i: number }[] = [];
      for (let i = 1; i < data.length; i++) {
        const episode = i + 1;
        const key = `${episode}:${algorithm.type}`;

        if (!existingSet.has(key)) {
          episodes.push({ episode, i });
        }
      }

      const results: DomainPrediction[] = [];
      for (let i = 0; i < episodes.length; i += CONCURRENCY) {
        const batch = episodes.slice(i, i + CONCURRENCY);
        const batchResults = await Promise.all(
          batch.map(({ episode, i }) =>
            AlgorithmExecutor.execute(
              algorithm,
              episode,
              data.slice(0, i),
              undefined,
              undefined,
              undefined,
              this.ballStatusReader,
            ),
          ),
        );
        results.push(...batchResults);
      }

      if (results.length > 0) {
        this.logger.debug(
          `[${algorithm.type}] Bulk inserting ${results.length} predictions...`,
        );
        await this.predictionRepository.saveMany(results);
      }
    }
  }
}
