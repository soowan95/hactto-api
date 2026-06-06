import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { AlgorithmFetchedEvent } from '../../domain/events/algorithm-fetched.event';
import { RedisService } from '../../../../helpers/redis/application/redis.service';

@EventsHandler(AlgorithmFetchedEvent)
export class AlgorithmFetchedHandler implements IEventHandler<AlgorithmFetchedEvent> {
  constructor(private readonly redisService: RedisService) {}

  async handle(event: AlgorithmFetchedEvent): Promise<void> {
    await this.redisService.del(`algorithm:${event.type}`);
    await this.redisService.del('algorithm:all');
  }
}
