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
      try {
        const parsed = JSON.parse(cachedData);
        if (Array.isArray(parsed) && parsed.length === 6) {
          return parsed;
        }
      } catch {
        // ignore and fallback
      }
    }

    const result = [25, 20, 18, 15, 12, 10];
    await this.redisService.set(cacheKey, JSON.stringify(result));
    return result;
  }
}
