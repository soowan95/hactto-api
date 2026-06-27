import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAlgorithmReliabilityHistoryQuery } from '../queries/get-algorithm-reliability-history.query';
import {
  IPredictionRepository,
  PREDICTION_REPOSITORY_TOKEN,
} from '../../domain/ports/prediction.port';
import { Inject } from '@nestjs/common';
import {
  ALGORITHM_REPOSITORY_TOKEN,
  IAlgorithmRepository,
} from '../../domain/ports/algorithm.port';
import { DomainAlgorithm } from '../../domain/aggregates/algorithm.entity';
import { RedisService } from '../../../../helpers/redis/application/redis.service';

@QueryHandler(GetAlgorithmReliabilityHistoryQuery)
export class GetAlgorithmReliabilityHistoryHandler implements IQueryHandler<GetAlgorithmReliabilityHistoryQuery> {
  constructor(
    @Inject(PREDICTION_REPOSITORY_TOKEN)
    private readonly predictionRepository: IPredictionRepository,
    @Inject(ALGORITHM_REPOSITORY_TOKEN)
    private readonly algorithmRepository: IAlgorithmRepository,
    private readonly redisService: RedisService,
  ) {}

  async execute(
    query: GetAlgorithmReliabilityHistoryQuery,
  ): Promise<{ episode: number; averageScore: number }[]> {
    // 1. Fetch predictions with reliability for this algorithm
    const cacheKey = `algorithm:${query.algorithmType}`;
    const cachedData = await this.redisService.get(cacheKey);
    let algorithm: DomainAlgorithm;
    if (cachedData) {
      algorithm = JSON.parse(cachedData);
    } else {
      algorithm = await this.algorithmRepository.findByType(
        query.algorithmType,
      );
      await this.redisService.set(cacheKey, JSON.stringify(algorithm));
    }
    const predictions =
      await this.predictionRepository.findAllByAlgorithmAndReliabilityIsNotNull(
        algorithm,
      );

    // 2. Group by episode and calculate average score in-memory
    const episodeGroups: Record<number, number[]> = {};
    for (const p of predictions) {
      if (!episodeGroups[p.episode]) {
        episodeGroups[p.episode] = [];
      }
      if (p.analysis) {
        episodeGroups[p.episode].push(p.analysis.getReliability());
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
