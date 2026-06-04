import { EventBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { PredictionGeneratedEvent } from '../../domain/events/prediction-generated.event';
import { RedisService } from '../../../../helpers/redis/application/redis.service';
import { Inject } from '@nestjs/common';
import {
  ANALYSIS_REPOSITORY_TOKEN,
  IAnalysisRepository,
} from '../../domain/ports/analysis.port';
import { DomainAnalysis } from '../../domain/aggregates/analysis.entity';
import {
  BALL_STATUS_READER_TOKEN,
  BallStatusReader,
} from '../../domain/ports/ball-status-reader.port';
import { AnalysisCreatedEvent } from '../../domain/events/analysis-created.event';
import { prisma } from '../../../../lib/prisma';

@EventsHandler(PredictionGeneratedEvent)
export class PredictionGeneratedHandler implements IEventHandler<PredictionGeneratedEvent> {
  constructor(
    @Inject(ANALYSIS_REPOSITORY_TOKEN)
    private readonly analysisRepository: IAnalysisRepository,
    @Inject(BALL_STATUS_READER_TOKEN)
    private readonly ballStatusReader: BallStatusReader,
    private readonly redisService: RedisService,
    private readonly eventBus: EventBus,
  ) {}

  async handle(event: PredictionGeneratedEvent): Promise<void> {
    if (event.visitorId && event.visitorId !== 'guest') {
      const cacheKey = `user:${event.visitorId}:predictions:history`;
      await this.redisService.del(cacheKey);
    }

    // Check if prediction already has an analysis associated
    const existing = await prisma.predictionAnalysis.findUnique({
      where: { predictionId: event.predictionId },
    });
    if (existing) {
      return; // Already created synchronously
    }

    const temperatures = await this.ballStatusReader.getBallTemperatures(
      event.generatedNumbers,
      event.episode,
    );

    const analysis: DomainAnalysis = await this.analysisRepository.insert(
      DomainAnalysis.create(event.generatedNumbers, temperatures),
    );

    this.eventBus.publish(
      new AnalysisCreatedEvent(event.predictionId, analysis.id as number),
    );
  }
}
