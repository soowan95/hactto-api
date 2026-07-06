import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetWinningShopsByEpisodeQuery } from '../queries/get-winning-shops-by-episode.query';
import { prisma } from '../../../../libs/prisma';

@QueryHandler(GetWinningShopsByEpisodeQuery)
export class GetWinningShopsByEpisodeHandler implements IQueryHandler<GetWinningShopsByEpisodeQuery> {
  async execute(query: GetWinningShopsByEpisodeQuery) {
    return prisma.winningShop.findMany({
      where: { episode: query.episode },
      orderBy: { sortOrder: 'asc' },
    });
  }
}
