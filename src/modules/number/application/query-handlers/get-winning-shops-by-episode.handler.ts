import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetWinningShopsByEpisodeQuery } from '../queries/get-winning-shops-by-episode.query';
import { prisma } from '../../../../libs/prisma';
import { Inject, Logger } from '@nestjs/common';
import {
  IWinningNumberFetcher,
  WINNING_NUMBER_FETCHER_TOKEN,
} from '../../domain/ports/winning-number-fetcher.port';

@QueryHandler(GetWinningShopsByEpisodeQuery)
export class GetWinningShopsByEpisodeHandler implements IQueryHandler<GetWinningShopsByEpisodeQuery> {
  private readonly logger = new Logger(GetWinningShopsByEpisodeHandler.name);

  constructor(
    @Inject(WINNING_NUMBER_FETCHER_TOKEN)
    private readonly winningNumberFetcher: IWinningNumberFetcher,
  ) {}

  async execute(query: GetWinningShopsByEpisodeQuery) {
    let shops = await prisma.winningShop.findMany({
      where: { episode: query.episode },
      orderBy: { sortOrder: 'asc' },
    });

    if (shops.length === 0) {
      this.logger.log(
        `Shops not found in DB for episode ${query.episode}. Fetching from external API...`,
      );
      try {
        const externalShops =
          await this.winningNumberFetcher.fetchShopsByEpisode(query.episode);

        if (externalShops.length > 0) {
          await prisma.winningShop.createMany({
            data: externalShops.map((shop) => ({
              episode: query.episode,
              rank: shop.rank,
              sortOrder: shop.sortOrder,
              shopName: shop.shopName,
              shopAddress: shop.shopAddress,
              purchaseType: shop.purchaseType,
              region: shop.region,
              shopLatitude: shop.shopLatitude,
              shopLongitude: shop.shopLongitude,
            })),
            skipDuplicates: true,
          });

          shops = await prisma.winningShop.findMany({
            where: { episode: query.episode },
            orderBy: { sortOrder: 'asc' },
          });
        }
      } catch (error) {
        this.logger.error(
          `Failed to fetch/save winning shops for episode ${query.episode}:`,
          error,
        );
      }
    }

    return shops;
  }
}
