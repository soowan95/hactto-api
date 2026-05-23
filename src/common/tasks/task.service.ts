import { Injectable } from '@nestjs/common';
import { WinningNumberService } from '../../modules/winning-number/winning-number.service';
import { Cron } from '@nestjs/schedule';
import { HacttoCronExpression } from './hactto-cron-expression.enum';

@Injectable()
export class TaskService {
  constructor(private readonly winningNumberService: WinningNumberService) {}

  @Cron(HacttoCronExpression.SATURDAY_AT_9PM)
  async fetchRecentWinningNumbers() {
    await this.winningNumberService.fetchRecentOne();
  }
}
