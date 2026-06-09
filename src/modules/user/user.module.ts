import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { HttpModule } from '@nestjs/axios';
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
import { HON_REPOSITORY_TOKEN } from './domain/ports/hon.port';
import { InfraHonRepository } from './infrastructure/adapters/infra-hon.repository';
import { HonService } from './application/hon.service';
import { PAYMENT_REPOSITORY_TOKEN } from './domain/ports/payment.port';
import { InfraPaymentRepository } from './infrastructure/adapters/infra-payment.repository';
import { PaymentService } from './application/payment.service';
import { PortoneClient } from './infrastructure/clients/portone.client';
import { PaymentController } from './presentation/payment.controller';

@Module({
  imports: [CqrsModule, WinningNumberModule, HttpModule],
  controllers: [
    PersonalAnalysisController,
    PersonalPredictionController,
    VisitorController,
    PaymentController,
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
    {
      provide: HON_REPOSITORY_TOKEN,
      useClass: InfraHonRepository,
    },
    {
      provide: PAYMENT_REPOSITORY_TOKEN,
      useClass: InfraPaymentRepository,
    },
    HonService,
    PaymentService,
    PortoneClient,
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [
    PERSONAL_ANALYSIS_REPOSITORY_TOKEN,
    VISITOR_REPOSITORY_TOKEN,
    HonService,
    PaymentService,
  ],
})
export class UserModule {}
