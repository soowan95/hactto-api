import { Module } from '@nestjs/common';
import { WinningNumberService } from './application/winning-number.service';
import { WinningNumberController } from './presentation/winning-number.controller';
import { HttpModule } from '@nestjs/axios';
import { WINNING_NUMBER_REPOSITORY_TOKEN } from './domain/ports/winning-number.repository.interface';
import { InfraWinningNumberRepository } from './infrastructure/adapters/infra-winning-number.repository';
import { WINNING_NUMBER_FETCHER_TOKEN } from './domain/ports/winning-number-fetcher.interface';
import { DhlotteryWinningNumberFetcher } from './infrastructure/adapters/dhlottery-winning-number.fetcher';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 3,
    }),
  ],
  controllers: [WinningNumberController],
  providers: [
    WinningNumberService,
    {
      provide: WINNING_NUMBER_REPOSITORY_TOKEN,
      useClass: InfraWinningNumberRepository,
    },
    {
      provide: WINNING_NUMBER_FETCHER_TOKEN,
      useClass: DhlotteryWinningNumberFetcher,
    },
  ],
  exports: [WinningNumberService, WINNING_NUMBER_REPOSITORY_TOKEN],
})
export class WinningNumberModule {}
