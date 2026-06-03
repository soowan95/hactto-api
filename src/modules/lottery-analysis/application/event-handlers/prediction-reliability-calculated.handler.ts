import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { PredictionReliabilityCalculatedEvent } from '../../domain/events/prediction-reliability-calculated.event';
import { RedisService } from '../../../../helpers/redis/application/redis.service';
import { Inject } from '@nestjs/common';
import {
  ALGORITHM_REPOSITORY_TOKEN,
  IAlgorithmRepository,
} from '../../domain/ports/algorithm.repository.port';

@EventsHandler(PredictionReliabilityCalculatedEvent)
export class PredictionReliabilityCalculatedHandler implements IEventHandler<PredictionReliabilityCalculatedEvent> {
  constructor(
    @Inject(ALGORITHM_REPOSITORY_TOKEN)
    private readonly algorithmRepository: IAlgorithmRepository,
    private readonly redisService: RedisService,
  ) {}

  async handle(event: PredictionReliabilityCalculatedEvent): Promise<void> {
    // 1. 사용자 예측 이력 캐시 무효화
    if (event.visitorId && event.visitorId !== 'guest') {
      const cacheKey = `user:${event.visitorId}:predictions:history`;
      await this.redisService.del(cacheKey);
    }

    // 2. 알고리즘 통계 캐시 무효화
    await this.redisService.del('algorithm:all:average-reliability');
    await this.redisService.del('algorithm:all:averages-list');
    const algorithms = await this.algorithmRepository.findAll();
    const types = algorithms.map((ag) => ag.type);
    for (const type of types) {
      await this.redisService.del(`algorithm:${type}:average-reliability`);
    }
  }
}
