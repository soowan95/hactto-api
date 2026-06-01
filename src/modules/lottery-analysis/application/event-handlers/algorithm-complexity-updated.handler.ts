import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { AlgorithmComplexityUpdatedEvent } from '../../domain/events/algorithm-complexity-updated.event';
import { RedisService } from '../../../../helpers/redis/application/redis.service';

@EventsHandler(AlgorithmComplexityUpdatedEvent)
export class AlgorithmComplexityUpdatedHandler implements IEventHandler<AlgorithmComplexityUpdatedEvent> {
  constructor(private readonly redisService: RedisService) {}

  async handle(event: AlgorithmComplexityUpdatedEvent): Promise<void> {
    const cacheKey = `algorithm:${event.type}`;
    await this.redisService.del(cacheKey);
  }
}
