import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AlgorithmController } from './presentation/algorithm.controller';
import { PersonalWeightController } from './presentation/personal-weight.controller';
import { AnalysisController } from './presentation/analysis.controller';
import { InfraPredictionRepository } from './infrastructure/adapters/infra-prediction.repository';
import { WinningNumberModule } from '../number/winning-number.module';
import { CommandHandlers, QueryHandlers, EventHandlers } from './application';
import { PREDICTION_REPOSITORY_TOKEN } from './domain/ports/prediction.port';
import { ANALYSIS_REPOSITORY_TOKEN } from './domain/ports/analysis.port';
import { InfraAnalysisRepository } from './infrastructure/adapters/infra-analysis.repository';
import { ALGORITHM_REPOSITORY_TOKEN } from './domain/ports/algorithm.port';
import { InfraAlgorithmRepository } from './infrastructure/adapters/infra-algorithm.repository';
import { WINNING_NUMBER_READER_TOKEN } from './domain/ports/winning-number-reader.port';
import { WinningNumberAdapter } from './infrastructure/adapters/winning-number.adapter';
import { WinningNumberMapper } from './infrastructure/mappers/winning-number.mapper';
import { BALL_STATUS_READER_TOKEN } from './domain/ports/ball-status-reader.port';
import { BallStatusAdapter } from './infrastructure/adapters/ball-status.adapter';
import { PREDICTION_ANALYSIS_REPOSITORY_TOKEN } from './domain/ports/prediction-analysis.port';
import { InfraPredictionAnalysisRepository } from './infrastructure/adapters/infra-prediction-analysis.repository';
import { WINNING_NUMBER_ANALYSIS_REPOSITORY_TOKEN } from './domain/ports/winning-number-analysis.port';
import { InfraWinningNumberAnalysisRepository } from './infrastructure/adapters/infra-winning-number-analysis.repository';

import { UserModule } from '../user/user.module';

@Module({
  imports: [CqrsModule, WinningNumberModule, UserModule],
  controllers: [
    AlgorithmController,
    PersonalWeightController,
    AnalysisController,
  ],
  providers: [
    {
      provide: PREDICTION_REPOSITORY_TOKEN,
      useClass: InfraPredictionRepository,
    },
    {
      provide: ANALYSIS_REPOSITORY_TOKEN,
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
    {
      provide: PREDICTION_ANALYSIS_REPOSITORY_TOKEN,
      useClass: InfraPredictionAnalysisRepository,
    },
    {
      provide: WINNING_NUMBER_ANALYSIS_REPOSITORY_TOKEN,
      useClass: InfraWinningNumberAnalysisRepository,
    },
    WinningNumberMapper,
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,
  ],
  exports: [
    PREDICTION_REPOSITORY_TOKEN,
    ANALYSIS_REPOSITORY_TOKEN,
    ALGORITHM_REPOSITORY_TOKEN,
    WINNING_NUMBER_READER_TOKEN,
    BALL_STATUS_READER_TOKEN,
    PREDICTION_ANALYSIS_REPOSITORY_TOKEN,
    WINNING_NUMBER_ANALYSIS_REPOSITORY_TOKEN,
    CqrsModule,
  ],
})
export class LotteryAnalysisModule {}
