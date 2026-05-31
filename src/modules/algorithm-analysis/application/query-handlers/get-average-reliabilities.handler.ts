import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAverageReliabilitiesQuery } from '../queries/get-average-reliabilities.query';
import { Inject } from '@nestjs/common';
import {
  ALGORITHM_ANALYSIS_REPOSITORY_TOKEN,
  IAlgorithmAnalysisRepository,
} from '../../domain/ports/algorithm-analysis.repository.interface';
import { AlgorithmType, getAlgorithm } from '@hactto/algorithm';
import { RedisService } from '../../../../helpers/redis/application/redis.service';

@QueryHandler(GetAverageReliabilitiesQuery)
export class GetAverageReliabilitiesHandler implements IQueryHandler<GetAverageReliabilitiesQuery> {
  constructor(
    @Inject(ALGORITHM_ANALYSIS_REPOSITORY_TOKEN)
    private readonly repository: IAlgorithmAnalysisRepository,
    private readonly redisService: RedisService,
  ) {}

  async execute(): Promise<{ algorithm: string; average: number }[]> {
    const cacheKey = 'algorithm:all:averages-list';
    const cachedData = await this.redisService.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const allTypes = getAlgorithm();
    const results = await Promise.all(
      allTypes.map(async (type) => {
        const score = await this.repository.getAverageScore(
          type as AlgorithmType,
        );
        return {
          algorithm: type,
          average: Math.round(score * 100) / 100, // round to 2 decimals
        };
      }),
    );

    // Sort by average descending
    results.sort((a, b) => b.average - a.average);

    await this.redisService.set(cacheKey, JSON.stringify(results), 1800); // 30 minutes

    return results;
  }
}
