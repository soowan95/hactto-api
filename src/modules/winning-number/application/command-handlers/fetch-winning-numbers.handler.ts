import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { FetchWinningNumbersCommand } from '../commands/fetch-winning-numbers.command';
import { Inject } from '@nestjs/common';
import {
  IWinningNumberRepository,
  WINNING_NUMBER_REPOSITORY_TOKEN,
} from '../../domain/ports/winning-number.repository.interface';
import {
  ExternalLotteryData,
  IWinningNumberFetcher,
  WINNING_NUMBER_FETCHER_TOKEN,
} from '../../domain/ports/winning-number-fetcher.interface';
import { DomainWinningNumber } from '../../domain/entities/winning-number.entity';
import { WinningNumberDrawer } from '../../domain/services/winning-number-drawer';
import { RedisService } from '../../../../helpers/redis/application/redis.service';

@CommandHandler(FetchWinningNumbersCommand)
export class FetchWinningNumbersHandler implements ICommandHandler<FetchWinningNumbersCommand> {
  constructor(
    @Inject(WINNING_NUMBER_FETCHER_TOKEN)
    private readonly winningNumberFetcher: IWinningNumberFetcher,
    @Inject(WINNING_NUMBER_REPOSITORY_TOKEN)
    private readonly winningNumberRepository: IWinningNumberRepository,
    private readonly redisService: RedisService,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: FetchWinningNumbersCommand): Promise<void> {
    const lastestEpisode = command.latestEpisode;
    const dataMap = new Map<number, ExternalLotteryData>();

    // From the 1st episode to the nearest multiple of 10 to the most recent episode.
    for (let i = 11; i < lastestEpisode; i = i + 10) {
      const list = await this.winningNumberFetcher.fetchByEpisode(i);
      for (const data of list) {
        dataMap.set(data.episode, data);
      }
    }

    // The last 10 episodes, excluding the most recent one.
    const list = await this.winningNumberFetcher.fetchByEpisode(lastestEpisode);
    for (const data of list) {
      dataMap.set(data.episode, data);
    }

    const dataList = Array.from(dataMap.values());

    for (const data of dataList) {
      const winningNumber = new DomainWinningNumber(
        data.episode,
        data.numbers,
        true,
      );
      await this.winningNumberRepository.upsert(winningNumber);
      await this.redisService.del(`winning-number:episode:${data.episode}`);
    }

    await this.fetchRecentOne();

    await this.redisService.del('winning-number:all');
    await this.redisService.del('winning-number:latest');
  }

  private async fetchRecentOne(): Promise<void> {
    const data = await this.winningNumberFetcher.fetchRecentOne();
    const winningNumber = this.publisher.mergeObjectContext(
      await this.winningNumberRepository.findByEpisode(data.episode),
    );
    if (!winningNumber.isDrawn) {
      winningNumber.draw(data.numbers);
      await this.winningNumberRepository.upsert(winningNumber);
      await this.winningNumberRepository.upsert(
        WinningNumberDrawer.drawPlaceholder(data.episode + 1),
      );

      winningNumber.commit();
    }
  }
}
