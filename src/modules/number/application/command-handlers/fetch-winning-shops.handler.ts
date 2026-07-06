import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { FetchWinningShopsCommand } from '../commands/fetch-winning-shops.command';
import { Inject, Logger } from '@nestjs/common';
import {
  IWinningNumberFetcher,
  WINNING_NUMBER_FETCHER_TOKEN,
} from '../../domain/ports/winning-number-fetcher.port';
import { prisma } from '../../../../libs/prisma';

@CommandHandler(FetchWinningShopsCommand)
export class FetchWinningShopsHandler implements ICommandHandler<FetchWinningShopsCommand> {
  private readonly logger = new Logger(FetchWinningShopsHandler.name);

  constructor(
    @Inject(WINNING_NUMBER_FETCHER_TOKEN)
    private readonly winningNumberFetcher: IWinningNumberFetcher,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(command: FetchWinningShopsCommand): Promise<void> {
    this.logger.log('Starting winning shops synchronization...');

    // 1. Get all drawn episodes
    const drawnNumbers = await prisma.winningNumber.findMany({
      where: { isDrawn: true },
      select: { episode: true },
      orderBy: { episode: 'asc' },
    });

    const drawnEpisodes = drawnNumbers.map((wn) => wn.episode);

    // 2. Find episodes that already have shops in the database
    const existingShops = await prisma.winningShop.findMany({
      distinct: ['episode'],
      select: { episode: true },
    });

    const existingEpisodesSet = new Set(existingShops.map((s) => s.episode));

    // 3. Filter missing episodes
    let missingEpisodes = drawnEpisodes.filter(
      (ep) => !existingEpisodesSet.has(ep),
    );

    this.logger.log(
      `Found ${missingEpisodes.length} episodes with missing winning shops out of ${drawnEpisodes.length} drawn episodes.`,
    );

    if (missingEpisodes.length === 0) {
      this.logger.log('All winning shops are already synchronized.');
      return;
    }

    // [Defense] Limit batch size per trigger to prevent IP blocking
    const BATCH_LIMIT = 30;
    if (missingEpisodes.length > BATCH_LIMIT) {
      this.logger.log(
        `Limiting sync to the first ${BATCH_LIMIT} missing episodes to prevent IP block. Please trigger again later.`,
      );
      missingEpisodes = missingEpisodes.slice(0, BATCH_LIMIT);
    }

    // 4. Fetch and store missing shops
    let consecutiveErrors = 0;
    for (const episode of missingEpisodes) {
      if (consecutiveErrors >= 3) {
        this.logger.error(
          'Stopping winning shops synchronization due to consecutive request failures (likely rate limited or IP blocked).',
        );
        break;
      }

      try {
        this.logger.log(`Fetching winning shops for episode ${episode}...`);
        const shops =
          await this.winningNumberFetcher.fetchShopsByEpisode(episode);

        if (shops.length > 0) {
          await prisma.winningShop.createMany({
            data: shops.map((shop) => ({
              episode,
              rank: shop.rank,
              sortOrder: shop.sortOrder,
              shopName: shop.shopName,
              shopAddress: shop.shopAddress,
              purchaseType: shop.purchaseType,
              region: shop.region,
              shopLatitude: shop.shopLatitude,
              shopLongitude: shop.shopLongitude,
            })),
          });
          this.logger.log(
            `Successfully saved ${shops.length} winning shops for episode ${episode}.`,
          );
        } else {
          this.logger.warn(`No winning shops returned for episode ${episode}.`);
        }

        // Reset consecutive errors count on successful request
        consecutiveErrors = 0;

        // [Defense] Sleep between 1.5s and 3s randomly to look like human browsing behaviour
        const delayMs = 1500 + Math.random() * 1500;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } catch (error) {
        consecutiveErrors++;
        this.logger.error(
          `Failed to fetch/save winning shops for episode ${episode}:`,
          error,
        );

        // [Defense] Add a longer penalty wait time on error before retrying or exiting
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    this.logger.log('Winning shops synchronization completed.');
  }
}
