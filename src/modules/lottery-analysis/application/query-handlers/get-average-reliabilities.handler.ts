import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAverageReliabilitiesQuery } from '../queries/get-average-reliabilities.query';
import { Inject } from '@nestjs/common';
import { RedisService } from '../../../../helpers/redis/application/redis.service';
import {
  IAnalysisRepository,
  ANALYSIS_REPOSITORY_TOKEN,
} from '../../domain/ports/analysis.port';
import {
  ALGORITHM_REPOSITORY_TOKEN,
  IAlgorithmRepository,
} from '../../domain/ports/algorithm.port';

@QueryHandler(GetAverageReliabilitiesQuery)
export class GetAverageReliabilitiesHandler implements IQueryHandler<GetAverageReliabilitiesQuery> {
  constructor(
    @Inject(ANALYSIS_REPOSITORY_TOKEN)
    private readonly reliabilityRepository: IAnalysisRepository,
    @Inject(ALGORITHM_REPOSITORY_TOKEN)
    private readonly algorithmRepository: IAlgorithmRepository,
    private readonly redisService: RedisService,
  ) {}

  async execute(): Promise<{ algorithm: string; average: number }[]> {
    const cacheKey = 'algorithm:all:averages-list';
    const cachedData = await this.redisService.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const algorithms = await this.algorithmRepository.findAll();
    const allTypes = algorithms.map((ag) => ag.type);
    const results = await Promise.all(
      allTypes.map(async (type) => {
        const score = await this.reliabilityRepository.getAverageScore(type);
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
