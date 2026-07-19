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
import { BadWordsService } from './application/bad-words.service';
import { PersonalPredictionController } from './presentation/personal-prediction.controller';
import { USER_REPOSITORY_TOKEN } from './domain/ports/user.port';
import { InfraUserRepository } from './infrastructure/adapters/infra-user.repository';
import { UserController } from './presentation/user.controller';
import { HON_REPOSITORY_TOKEN } from './domain/ports/hon.port';
import { InfraHonRepository } from './infrastructure/adapters/infra-hon.repository';
import { HonService } from './application/hon.service';
import { PAYMENT_REPOSITORY_TOKEN } from './domain/ports/payment.port';
import { InfraPaymentRepository } from './infrastructure/adapters/infra-payment.repository';
import { PaymentService } from './application/payment.service';
import { PortoneClient } from './infrastructure/clients/portone.client';
import { PaymentController } from './presentation/payment.controller';
import { BoardController } from './presentation/board.controller';
import { LottoOcrService } from './application/lotto-ocr.service';
import {} from './presentation/policy.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [CqrsModule, WinningNumberModule, HttpModule, AuthModule],
  controllers: [
    PersonalAnalysisController,
    PersonalPredictionController,
    UserController,
    PaymentController,
    BoardController,
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
      provide: USER_REPOSITORY_TOKEN,
      useClass: InfraUserRepository,
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
    LottoOcrService,
    BadWordsService,
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [
    PERSONAL_ANALYSIS_REPOSITORY_TOKEN,
    USER_REPOSITORY_TOKEN,
    HonService,
    PaymentService,
    HON_REPOSITORY_TOKEN,
    PAYMENT_REPOSITORY_TOKEN,
    PortoneClient,
    BadWordsService,
  ],
})
export class UserModule {}
