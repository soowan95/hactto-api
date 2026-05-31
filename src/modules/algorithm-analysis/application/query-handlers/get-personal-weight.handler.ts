import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetPersonalWeightQuery } from '../queries/get-personal-weight.query';
import { RedisService } from '../../../../helpers/redis/application/redis.service';

@QueryHandler(GetPersonalWeightQuery)
export class GetPersonalWeightHandler implements IQueryHandler<GetPersonalWeightQuery> {
  constructor(private readonly redisService: RedisService) {}

  async execute(query: GetPersonalWeightQuery): Promise<number[]> {
    const cacheKey = `user:${query.visitorId}:algorithm:${query.algorithm}:weights`;

    const cachedData = await this.redisService.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    } else {
      const result = [25, 20, 15, 15, 10, 10, 5];
      await this.redisService.set(cacheKey, JSON.stringify(result));
      return [25, 20, 15, 15, 10, 10, 5];
    }
  }
}
