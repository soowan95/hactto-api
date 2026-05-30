import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CommandBus } from '@nestjs/cqrs';
import { HacttoCronExpression } from './hactto-cron-expression.enum';
import { FetchRecentWinningNumberCommand } from '../../modules/winning-number/application/commands/fetch-recent-winning-number/fetch-recent-winning-number.command';
import { AnalyzeReliabilityCommand } from '../../modules/algorithm-analysis/application/commands/analyze-reliability/analyze-reliability.command';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(private readonly commandBus: CommandBus) {}

  @Cron(HacttoCronExpression.SATURDAY_AT_9PM, {
    timeZone: 'Asia/Seoul',
  })
  async fetchRecentWinningNumbers() {
    this.logger.debug('🚀 Fetching recent winning numbers...');
    await this.commandBus.execute(new FetchRecentWinningNumberCommand());
    this.logger.debug('🚀 Analyzing non reliability algorithm results...');
    await this.commandBus.execute(new AnalyzeReliabilityCommand());
    this.logger.debug('🏁 All tasks completed.');
  }
}
