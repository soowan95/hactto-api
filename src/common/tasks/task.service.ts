import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CommandBus } from '@nestjs/cqrs';
import { HacttoCronExpression } from './hactto-cron-expression.enum';
import { FetchRecentWinningNumberCommand } from '../../modules/winning-number/application/commands/fetch-recent-winning-number.command';
import { AnalyzeReliabilityCommand } from '../../modules/lottery-analysis/application/commands/analyze-reliability.command';
import { SystemStatusService } from '../services/system-status.service';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly systemStatusService: SystemStatusService,
  ) {}

  @Cron(HacttoCronExpression.SATURDAY_AT_8PM_30M, {
    timeZone: 'Asia/Seoul',
  })
  async lockSiteForAnalysis() {
    this.logger.debug(
      '🔒 Locking site for winning number drawing and analysis...',
    );
    await this.systemStatusService.setAnalysisStatus(true);
  }

  @Cron(HacttoCronExpression.SATURDAY_AT_8PM_40M, {
    timeZone: 'Asia/Seoul',
  })
  async fetchRecentWinningNumbers() {
    this.logger.debug('🚀 Starting fetch recent winning numbers job...');
    const maxRetries = 15; // 15 attempts
    const retryIntervalMs = 2 * 60 * 1000; // 2 minutes

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.debug(
          `Executing FetchRecentWinningNumberCommand (Attempt ${attempt}/${maxRetries})...`,
        );
        const result = (await this.commandBus.execute(
          new FetchRecentWinningNumberCommand(),
        )) as {
          status: 'success' | 'already_drawn' | 'waiting_new_episode';
          episode: number;
        };

        this.logger.debug(
          `Command execution result: ${JSON.stringify(result)}`,
        );

        if (result.status === 'success') {
          this.logger.debug(
            `🎉 Successfully drew episode ${result.episode}. Triggering reliability analysis...`,
          );
          await this.commandBus.execute(new AnalyzeReliabilityCommand());
          this.logger.debug(
            `Reliability analysis completed for episode ${result.episode}.`,
          );
          return;
        }

        if (result.status === 'already_drawn') {
          this.logger.debug(
            `Episode ${result.episode} is already drawn. Unlocking site immediately.`,
          );
          await this.systemStatusService.setAnalysisStatus(false);
          return;
        }

        this.logger.debug(
          `Expected new episode is not published yet (returned episode ${result.episode}). Waiting for retry...`,
        );
      } catch (error) {
        this.logger.error(`Error on attempt ${attempt}:`, error);
      }

      if (attempt < maxRetries) {
        this.logger.debug(
          `Waiting ${retryIntervalMs / 1000}s before next retry...`,
        );
        await new Promise((resolve) => setTimeout(resolve, retryIntervalMs));
      }
    }

    this.logger.warn(
      '⚠️ Reached max retries without drawing new numbers. Unlocking site as fallback.',
    );
    await this.systemStatusService.setAnalysisStatus(false);
  }
}
