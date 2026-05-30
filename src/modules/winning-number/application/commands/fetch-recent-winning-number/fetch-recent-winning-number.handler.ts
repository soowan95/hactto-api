import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { FetchRecentWinningNumberCommand } from './fetch-recent-winning-number.command';
import { Inject } from '@nestjs/common';
import {
  IWinningNumberRepository,
  WINNING_NUMBER_REPOSITORY_TOKEN,
} from '../../../domain/ports/winning-number.repository.interface';
import {
  IWinningNumberFetcher,
  WINNING_NUMBER_FETCHER_TOKEN,
} from '../../../domain/ports/winning-number-fetcher.interface';
import { WinningNumberDrawer } from '../../../domain/services/winning-number-drawer';
import { RedisService } from '../../../../../helpers/redis/redis.service';

@CommandHandler(FetchRecentWinningNumberCommand)
export class FetchRecentWinningNumberHandler implements ICommandHandler<FetchRecentWinningNumberCommand> {
  constructor(
    @Inject(WINNING_NUMBER_FETCHER_TOKEN)
    private readonly winningNumberFetcher: IWinningNumberFetcher,
    @Inject(WINNING_NUMBER_REPOSITORY_TOKEN)
    private readonly winningNumberRepository: IWinningNumberRepository,
    private readonly redisService: RedisService,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(command: FetchRecentWinningNumberCommand): Promise<void> {
    const data = await this.winningNumberFetcher.fetchRecentOne();
    const winningNumber = await this.winningNumberRepository.findByEpisode(
      data.episode,
    );
    if (!winningNumber.isDrawn) {
      winningNumber.draw(data.numbers);
      await this.winningNumberRepository.upsert(winningNumber);
      await this.winningNumberRepository.upsert(
        WinningNumberDrawer.drawPlaceholder(data.episode + 1),
      );

      await this.redisService.del(`winning-number:episode:${data.episode}`);
      await this.redisService.del(`winning-number:episode:${data.episode + 1}`);
      await this.redisService.del('winning-number:all');
      await this.redisService.del('winning-number:latest');
    }
  }
}
