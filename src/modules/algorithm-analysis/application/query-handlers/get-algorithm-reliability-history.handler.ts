import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAlgorithmReliabilityHistoryQuery } from '../queries/get-algorithm-reliability-history.query';
import { prisma } from '../../../../lib/prisma';

@QueryHandler(GetAlgorithmReliabilityHistoryQuery)
export class GetAlgorithmReliabilityHistoryHandler implements IQueryHandler<GetAlgorithmReliabilityHistoryQuery> {
  async execute(
    query: GetAlgorithmReliabilityHistoryQuery,
  ): Promise<{ episode: number; averageScore: number }[]> {
    // 1. Fetch predictions with reliability for this algorithm
    const predictions = await prisma.prediction.findMany({
      where: {
        algorithm: query.algorithm,
        reliability: { isNot: null },
      },
      select: {
        episode: true,
        reliability: {
          select: {
            score: true,
          },
        },
      },
      orderBy: {
        episode: 'desc',
      },
    });

    // 2. Group by episode and calculate average score in-memory
    const episodeGroups: Record<number, number[]> = {};
    for (const p of predictions) {
      if (!episodeGroups[p.episode]) {
        episodeGroups[p.episode] = [];
      }
      if (p.reliability) {
        episodeGroups[p.episode].push(p.reliability.score);
      }
    }

    // 3. Convert to list and calculate average
    const results = Object.entries(episodeGroups).map(
      ([episodeStr, scores]) => {
        const episode = parseInt(episodeStr, 10);
        const sum = scores.reduce((a, b) => a + b, 0);
        const average = scores.length > 0 ? sum / scores.length : 0;
        return {
          episode,
          averageScore: Math.round(average * 100) / 100,
        };
      },
    );

    // 4. Sort by episode asc (chronological) to return latest 20 rounds
    return results.sort((a, b) => a.episode - b.episode).slice(-20);
  }
}
