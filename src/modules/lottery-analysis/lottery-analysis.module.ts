import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AlgorithmController } from './presentation/algorithm.controller';
import { PersonalWeightController } from './presentation/personal-weight.controller';
import { ReliabilityController } from './presentation/reliability.controller';
import { InfraPredictionRepository } from './infrastructure/adapters/infra-prediction.repository';
import { WinningNumberModule } from '../number/winning-number.module';
import { CommandHandlers, QueryHandlers, EventHandlers } from './application';
import { PREDICTION_REPOSITORY_TOKEN } from './domain/ports/prediction.repository.port';
import { RELIABILITY_ANALYSIS_TOKEN } from './domain/ports/analysis.repository.port';
import { InfraAnalysisRepository } from './infrastructure/adapters/infra-analysis.repository';
import { ALGORITHM_REPOSITORY_TOKEN } from './domain/ports/algorithm.repository.port';
import { InfraAlgorithmRepository } from './infrastructure/adapters/infra-algorithm.repository';
import { WINNING_NUMBER_READER_TOKEN } from './domain/ports/winning-number-reader.port';
import { WinningNumberAdapter } from './infrastructure/adapters/winning-number.adapter';
import { WinningNumberMapper } from './infrastructure/mappers/winning-number.mapper';
import { BALL_STATUS_READER_TOKEN } from './domain/ports/ball-status-reader.port';
import { BallStatusAdapter } from './infrastructure/adapters/ball-status.adapter';

@Module({
  imports: [CqrsModule, WinningNumberModule],
  controllers: [
    AlgorithmController,
    PersonalWeightController,
    ReliabilityController,
  ],
  providers: [
    {
      provide: PREDICTION_REPOSITORY_TOKEN,
      useClass: InfraPredictionRepository,
    },
    {
      provide: RELIABILITY_ANALYSIS_TOKEN,
      useClass: InfraAnalysisRepository,
    },
    {
      provide: ALGORITHM_REPOSITORY_TOKEN,
      useClass: InfraAlgorithmRepository,
    },
    {
      provide: WINNING_NUMBER_READER_TOKEN,
      useClass: WinningNumberAdapter,
    },
    {
      provide: BALL_STATUS_READER_TOKEN,
      useClass: BallStatusAdapter,
    },
    WinningNumberMapper,
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,
  ],
  exports: [
    PREDICTION_REPOSITORY_TOKEN,
    RELIABILITY_ANALYSIS_TOKEN,
    ALGORITHM_REPOSITORY_TOKEN,
    WINNING_NUMBER_READER_TOKEN,
    BALL_STATUS_READER_TOKEN,
    CqrsModule,
  ],
})
export class LotteryAnalysisModule {}
