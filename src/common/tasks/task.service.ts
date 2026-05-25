import { Injectable, Logger } from '@nestjs/common';
import { WinningNumberService } from '../../modules/winning-number/application/winning-number.service';
import { Cron } from '@nestjs/schedule';
import { HacttoCronExpression } from './hactto-cron-expression.enum';
import { ReliabilityService } from '../../modules/reliability/application/reliability.service';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(
    private readonly winningNumberService: WinningNumberService,
    private readonly reliabilityService: ReliabilityService,
  ) {}

  @Cron(HacttoCronExpression.SATURDAY_AT_9PM, {
    timeZone: 'Asia/Seoul',
  })
  async fetchRecentWinningNumbers() {
    this.logger.debug('🚀 Fetching recent winning numbers...');
    await this.winningNumberService.fetchRecentOne();
    this.logger.debug('🚀 Analyzing non reliability algorithm results...');
    await this.reliabilityService.analyze();
    this.logger.debug('🏁 All tasks completed.');
  }
}
