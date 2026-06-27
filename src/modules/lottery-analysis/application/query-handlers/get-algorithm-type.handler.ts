import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAlgorithmTypeQuery } from '../queries/get-algorithm-type.query';
import { RedisService } from '../../../../helpers/redis/application/redis.service';
import { Inject } from '@nestjs/common';
import {
  ALGORITHM_REPOSITORY_TOKEN,
  IAlgorithmRepository,
} from '../../domain/ports/algorithm.port';
import { DomainAlgorithm } from '../../domain/aggregates/algorithm.entity';

@QueryHandler(GetAlgorithmTypeQuery)
export class GetAlgorithmTypeHandler implements IQueryHandler<GetAlgorithmTypeQuery> {
  constructor(
    @Inject(ALGORITHM_REPOSITORY_TOKEN)
    private readonly algorithmTypeRepository: IAlgorithmRepository,
    private readonly redisService: RedisService,
  ) {}

  async execute(
    query: GetAlgorithmTypeQuery,
  ): Promise<DomainAlgorithm | DomainAlgorithm[]> {
    if (query.type) {
      const cacheKey = `algorithm:${query.type}`;
      const cachedData = await this.redisService.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }

      const data = await this.algorithmTypeRepository.findByType(query.type);
      await this.redisService.set(cacheKey, JSON.stringify(data));
      return data;
    }

    const cacheKey = 'algorithm:all';
    const cachedData = await this.redisService.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const data = await this.algorithmTypeRepository.findAll();

    await this.redisService.set(cacheKey, JSON.stringify(data));
    for (const algorithm of data) {
      await this.redisService.set(
        `algorithm:${algorithm.type}`,
        JSON.stringify(algorithm),
      );
    }

    return data;
  }
}
