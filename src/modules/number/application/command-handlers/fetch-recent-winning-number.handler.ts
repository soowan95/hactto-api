import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { FetchRecentWinningNumberCommand } from '../commands/fetch-recent-winning-number.command';
import { Inject } from '@nestjs/common';
import {
  IWinningNumberRepository,
  WINNING_NUMBER_REPOSITORY_TOKEN,
} from '../../domain/ports/winning-number.repository.port';
import {
  IWinningNumberFetcher,
  WINNING_NUMBER_FETCHER_TOKEN,
} from '../../domain/ports/winning-number-fetcher.port';
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
  async execute(command: FetchRecentWinningNumberCommand): Promise<{
    status: 'success' | 'already_drawn' | 'waiting_new_episode';
    episode: number;
  }> {
    const data = await this.winningNumberFetcher.fetchRecentOne();

    // Find the latest drawn episode in the database to compare
    const latestDrawn =
      await this.winningNumberRepository.findLatestWithWinningNumber();
    const latestDrawnEpisode = latestDrawn ? latestDrawn.episode : 0;

    if (data.episode <= latestDrawnEpisode) {
      // The API is still returning the old episode, we must wait for the new drawing to be published
      return { status: 'waiting_new_episode', episode: data.episode };
    }

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
      return { status: 'success', episode: data.episode };
    }

    return { status: 'already_drawn', episode: data.episode };
  }
}
