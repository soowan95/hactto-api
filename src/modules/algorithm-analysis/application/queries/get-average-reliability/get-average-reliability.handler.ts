import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAverageReliabilityQuery } from './get-average-reliability.query';
import { Inject } from '@nestjs/common';
import {
  ALGORITHM_ANALYSIS_REPOSITORY_TOKEN,
  IAlgorithmAnalysisRepository,
} from '../../../domain/ports/algorithm-analysis.repository.interface';
import { RedisService } from '../../../../../helpers/redis/redis.service';

@QueryHandler(GetAverageReliabilityQuery)
export class GetAverageReliabilityHandler implements IQueryHandler<GetAverageReliabilityQuery> {
  constructor(
    @Inject(ALGORITHM_ANALYSIS_REPOSITORY_TOKEN)
    private readonly repository: IAlgorithmAnalysisRepository,
    private readonly redisService: RedisService,
  ) {}

  async execute(query: GetAverageReliabilityQuery): Promise<number> {
    const cacheKey = `algorithm:${query.algorithm || 'all'}:average-reliability`;

    const cachedData = await this.redisService.get(cacheKey);
    if (cachedData) {
      return parseFloat(cachedData);
    }

    const result = await this.repository.getAverageScore(query.algorithm);

    await this.redisService.set(cacheKey, result.toString(), 1800); // 30 minutes

    return result;
  }
}
