import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { PredictionAnalyzedEvent } from '../../domain/events/prediction-analyzed.event';
import { RedisService } from '../../../../helpers/redis/application/redis.service';
import { Inject } from '@nestjs/common';
import {
  ALGORITHM_REPOSITORY_TOKEN,
  IAlgorithmRepository,
} from '../../domain/ports/algorithm.port';
import {
  ANALYSIS_REPOSITORY_TOKEN,
  IAnalysisRepository,
} from '../../domain/ports/analysis.port';

@EventsHandler(PredictionAnalyzedEvent)
export class PredictionAnalyzedHandler implements IEventHandler<PredictionAnalyzedEvent> {
  constructor(
    @Inject(ALGORITHM_REPOSITORY_TOKEN)
    private readonly algorithmRepository: IAlgorithmRepository,
    @Inject(ANALYSIS_REPOSITORY_TOKEN)
    private readonly analysisRepository: IAnalysisRepository,
    private readonly redisService: RedisService,
  ) {}

  async handle(event: PredictionAnalyzedEvent): Promise<void> {
    // 1. 사용자 예측 이력 캐시 무효화
    if (event.visitorId) {
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

    // 3. Analysis reliability 저장
    await this.analysisRepository;
  }
}
