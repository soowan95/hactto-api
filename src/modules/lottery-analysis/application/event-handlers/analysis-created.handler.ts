import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { AnalysisCreatedEvent } from '../../domain/events/analysis-created.event';
import { Inject } from '@nestjs/common';
import {
  IPredictionAnalysisRepository,
  PREDICTION_ANALYSIS_REPOSITORY_TOKEN,
} from '../../domain/ports/prediction-analysis.port';
import { DomainPredictionAnalysis } from '../../domain/aggregates/prediction-analysis.entity';

@EventsHandler(AnalysisCreatedEvent)
export class AnalysisCreatedHandler implements IEventHandler<AnalysisCreatedEvent> {
  constructor(
    @Inject(PREDICTION_ANALYSIS_REPOSITORY_TOKEN)
    private readonly predictionAnalysisRepository: IPredictionAnalysisRepository,
  ) {}

  async handle(event: AnalysisCreatedEvent): Promise<void> {
    await this.predictionAnalysisRepository.insert(
      new DomainPredictionAnalysis(event.predictionId, event.analysisId),
    );
  }
}
