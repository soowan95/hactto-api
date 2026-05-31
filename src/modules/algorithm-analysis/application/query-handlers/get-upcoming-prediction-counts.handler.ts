import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUpcomingPredictionCountsQuery } from '../queries/get-upcoming-prediction-counts.query';
import { prisma } from '../../../../lib/prisma';
import { getAlgorithm } from '@hactto/algorithm';

@QueryHandler(GetUpcomingPredictionCountsQuery)
export class GetUpcomingPredictionCountsHandler implements IQueryHandler<GetUpcomingPredictionCountsQuery> {
  async execute(): Promise<{ algorithm: string; count: number }[]> {
    // 1. Find the latest drawn episode
    const latestDrawn = await prisma.winningNumber.findFirst({
      where: { isDrawn: true },
      orderBy: { episode: 'desc' },
    });

    const upcomingEpisode = latestDrawn ? latestDrawn.episode + 1 : 1;

    // 2. Count predictions generated for this upcoming episode grouped by algorithm
    const counts = await prisma.prediction.groupBy({
      by: ['algorithm'],
      where: {
        episode: upcomingEpisode,
      },
      _count: {
        id: true,
      },
    });

    // 3. Make sure all algorithm types are present in the response
    const allTypes = getAlgorithm();
    return allTypes.map((type) => {
      const group = counts.find((c) => c.algorithm === type);
      return {
        algorithm: type,
        count: group ? group._count.id : 0,
      };
    });
  }
}
