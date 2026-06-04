import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAverageReliabilityQuery } from '../queries/get-average-reliability.query';
import { Inject } from '@nestjs/common';
import { RedisService } from '../../../../helpers/redis/application/redis.service';
import {
  IAnalysisRepository,
  ANALYSIS_REPOSITORY_TOKEN,
} from '../../domain/ports/analysis.port';

@QueryHandler(GetAverageReliabilityQuery)
export class GetAverageReliabilityHandler implements IQueryHandler<GetAverageReliabilityQuery> {
  constructor(
    @Inject(ANALYSIS_REPOSITORY_TOKEN)
    private readonly repository: IAnalysisRepository,
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
