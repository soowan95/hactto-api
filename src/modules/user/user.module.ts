import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PERSONAL_ANALYSIS_REPOSITORY_TOKEN } from './domain/ports/personal-analysis.port';
import { InfraPersonalAnalysisRepository } from './infrastructure/adapters/infra-personal-analysis.repository';
import { PERSONAL_PREDICTION_REPOSITORY_TOKEN } from './domain/ports/personal-prediction.port';
import { InfraPersonalPredictionRepository } from './infrastructure/adapters/infra-personal-prediction.repository';
import { USER_BALL_STATUS_READER_TOKEN } from './domain/ports/ball-status-reader.port';
import { UserBallStatusAdapter } from './infrastructure/adapters/user-ball-status.adapter';
import { WinningNumberModule } from '../number/winning-number.module';
import { CommandHandlers, QueryHandlers } from './application';
import { PersonalAnalysisController } from './presentation/personal-analysis.controller';
import { PersonalPredictionController } from './presentation/personal-prediction.controller';
import { VISITOR_REPOSITORY_TOKEN } from './domain/ports/visitor.port';
import { InfraVisitorRepository } from './infrastructure/adapters/infra-visitor.repository';
import { VisitorController } from './presentation/visitor.controller';

@Module({
  imports: [CqrsModule, WinningNumberModule],
  controllers: [
    PersonalAnalysisController,
    PersonalPredictionController,
    VisitorController,
  ],
  providers: [
    {
      provide: PERSONAL_ANALYSIS_REPOSITORY_TOKEN,
      useClass: InfraPersonalAnalysisRepository,
    },
    {
      provide: PERSONAL_PREDICTION_REPOSITORY_TOKEN,
      useClass: InfraPersonalPredictionRepository,
    },
    {
      provide: USER_BALL_STATUS_READER_TOKEN,
      useClass: UserBallStatusAdapter,
    },
    {
      provide: VISITOR_REPOSITORY_TOKEN,
      useClass: InfraVisitorRepository,
    },
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [PERSONAL_ANALYSIS_REPOSITORY_TOKEN, VISITOR_REPOSITORY_TOKEN],
})
export class UserModule {}
