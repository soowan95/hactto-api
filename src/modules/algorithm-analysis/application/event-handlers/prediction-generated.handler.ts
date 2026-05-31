import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { PredictionGeneratedEvent } from '../../domain/events/prediction-generated.event';
import { RedisService } from '../../../../helpers/redis/application/redis.service';

@EventsHandler(PredictionGeneratedEvent)
export class PredictionGeneratedHandler implements IEventHandler<PredictionGeneratedEvent> {
  constructor(private readonly redisService: RedisService) {}

  async handle(event: PredictionGeneratedEvent): Promise<void> {
    if (event.visitorId && event.visitorId !== 'guest') {
      const cacheKey = `user:${event.visitorId}:predictions:history`;
      await this.redisService.del(cacheKey);
    }
  }
}
