import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AlgorithmController } from './presentation/algorithm.controller';
import { PersonalWeightController } from './presentation/personal-weight.controller';
import { ReliabilityController } from './presentation/reliability.controller';
import { ALGORITHM_ANALYSIS_REPOSITORY_TOKEN } from './domain/ports/algorithm-analysis.repository.interface';
import { InfraAlgorithmAnalysisRepository } from './infrastructure/adapters/infra-algorithm-analysis.repository';
import { WinningNumberModule } from '../winning-number/winning-number.module';
import { CommandHandlers, QueryHandlers } from './application';

@Module({
  imports: [CqrsModule, WinningNumberModule],
  controllers: [
    AlgorithmController,
    PersonalWeightController,
    ReliabilityController,
  ],
  providers: [
    {
      provide: ALGORITHM_ANALYSIS_REPOSITORY_TOKEN,
      useClass: InfraAlgorithmAnalysisRepository,
    },
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [ALGORITHM_ANALYSIS_REPOSITORY_TOKEN, CqrsModule],
})
export class AlgorithmAnalysisModule {}
