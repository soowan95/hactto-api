import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CommandBus } from '@nestjs/cqrs';
import { HacttoCronExpression } from './hactto-cron-expression.enum';
import { FetchRecentWinningNumberCommand } from '../../modules/winning-number/application/commands/fetch-recent-winning-number.command';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(private readonly commandBus: CommandBus) {}

  @Cron(HacttoCronExpression.SATURDAY_AT_8PM_40M, {
    timeZone: 'Asia/Seoul',
  })
  async fetchRecentWinningNumbers() {
    this.logger.debug('🚀 Fetching recent winning numbers...');
    await this.commandBus.execute(new FetchRecentWinningNumberCommand());
    this.logger.debug('🏁 All tasks completed.');
  }
}
