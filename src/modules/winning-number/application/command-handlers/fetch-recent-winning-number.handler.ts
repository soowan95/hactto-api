import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { FetchRecentWinningNumberCommand } from '../commands/fetch-recent-winning-number.command';
import { Inject } from '@nestjs/common';
import {
  IWinningNumberRepository,
  WINNING_NUMBER_REPOSITORY_TOKEN,
} from '../../domain/ports/winning-number.repository.interface';
import {
  IWinningNumberFetcher,
  WINNING_NUMBER_FETCHER_TOKEN,
} from '../../domain/ports/winning-number-fetcher.interface';
import { WinningNumberDrawer } from '../../domain/services/winning-number-drawer';

@CommandHandler(FetchRecentWinningNumberCommand)
export class FetchRecentWinningNumberHandler implements ICommandHandler<FetchRecentWinningNumberCommand> {
  constructor(
    @Inject(WINNING_NUMBER_FETCHER_TOKEN)
    private readonly winningNumberFetcher: IWinningNumberFetcher,
    @Inject(WINNING_NUMBER_REPOSITORY_TOKEN)
    private readonly winningNumberRepository: IWinningNumberRepository,
    private readonly publisher: EventPublisher,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(command: FetchRecentWinningNumberCommand): Promise<void> {
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
