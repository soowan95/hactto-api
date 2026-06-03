import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { WinningNumberController } from './presentation/winning-number.controller';
import { HttpModule } from '@nestjs/axios';
import { WINNING_NUMBER_REPOSITORY_TOKEN } from './domain/ports/winning-number.repository.port';
import { InfraWinningNumberRepository } from './infrastructure/adapters/infra-winning-number.repository';
import { WINNING_NUMBER_FETCHER_TOKEN } from './domain/ports/winning-number-fetcher.port';
import { DhlotteryWinningNumberFetcher } from './infrastructure/adapters/dhlottery-winning-number.fetcher';
import { CommandHandlers, QueryHandlers, EventHandlers } from './application';

@Module({
  imports: [
    CqrsModule,
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 3,
    }),
  ],
  controllers: [WinningNumberController],
  providers: [
    {
      provide: WINNING_NUMBER_REPOSITORY_TOKEN,
      useClass: InfraWinningNumberRepository,
    },
    {
      provide: WINNING_NUMBER_FETCHER_TOKEN,
      useClass: DhlotteryWinningNumberFetcher,
    },
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,
  ],
  exports: [WINNING_NUMBER_REPOSITORY_TOKEN, CqrsModule],
})
export class WinningNumberModule {}
