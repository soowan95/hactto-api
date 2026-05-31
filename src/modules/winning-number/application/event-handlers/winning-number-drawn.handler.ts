import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { WinningNumberDrawnEvent } from '../../domain/events/winning-number-drawn.event';
import { AnalyzeReliabilityCommand } from '../../../algorithm-analysis/application/commands/analyze-reliability.command';
import { RedisService } from '../../../../helpers/redis/application/redis.service';

@EventsHandler(WinningNumberDrawnEvent)
export class WinningNumberDrawnHandler implements IEventHandler<WinningNumberDrawnEvent> {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly redisService: RedisService,
  ) {}

  async handle(event: WinningNumberDrawnEvent) {
    // 1. 당첨 번호 캐시 무효화
    await this.redisService.del(`winning-number:episode:${event.episode}`);
    await this.redisService.del(`winning-number:episode:${event.episode + 1}`);
    await this.redisService.del('winning-number:all');
    await this.redisService.del('winning-number:latest');

    // 2. 신뢰도 측정 실행
    await this.commandBus.execute(new AnalyzeReliabilityCommand());
  }
}
