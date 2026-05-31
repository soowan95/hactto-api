import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { AnalyzeReliabilityCommand } from '../commands/analyze-reliability.command';
import { Inject, Logger } from '@nestjs/common';
import {
  ALGORITHM_ANALYSIS_REPOSITORY_TOKEN,
  IAlgorithmAnalysisRepository,
} from '../../domain/ports/algorithm-analysis.repository.interface';
import {
  WINNING_NUMBER_REPOSITORY_TOKEN,
  IWinningNumberRepository,
} from '../../../winning-number/domain/ports/winning-number.repository.interface';
import { DomainPrediction } from '../../domain/aggregates/prediction.entity';
import { DomainWinningNumber } from '../../../winning-number/domain/entities/winning-number.entity';
import { AlgorithmType, getAlgorithm } from '@hactto/algorithm';
import { AlgorithmExecutor } from '../../domain/services/algorithm-executor';

import { SystemStatusService } from '../../../../common/services/system-status.service';

@CommandHandler(AnalyzeReliabilityCommand)
export class AnalyzeReliabilityHandler implements ICommandHandler<AnalyzeReliabilityCommand> {
  private readonly logger = new Logger(AnalyzeReliabilityHandler.name);

  constructor(
    @Inject(ALGORITHM_ANALYSIS_REPOSITORY_TOKEN)
    private readonly repository: IAlgorithmAnalysisRepository,
    @Inject(WINNING_NUMBER_REPOSITORY_TOKEN)
    private readonly winningNumberRepository: IWinningNumberRepository,
    private readonly publisher: EventPublisher,
    private readonly systemStatusService: SystemStatusService,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(command: AnalyzeReliabilityCommand): Promise<void> {
    try {
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

        const prediction = this.publisher.mergeObjectContext(result);
        prediction.calculateReliability(
          winningNumber,
          prediction.weights.toValues(),
        );

        resultsToSave.push(prediction);
      }

      if (resultsToSave.length > 0) {
        await this.repository.saveMany(resultsToSave);
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
