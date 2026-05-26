import { Module } from '@nestjs/common';
import { ReliabilityController } from './presentation/reliability.controller';
import { ReliabilityService } from './application/reliability.service';
import { AlgorithmModule } from '../algorithm/algorithm.module';
import { WinningNumberModule } from '../winning-number/winning-number.module';
import { RELIABILITY_REPOSITORY_TOKEN } from './domain/ports/reliability.repository.interface';
import { InfraReliabilityRepository } from './infrastructure/adapters/infra-reliability.repository';

@Module({
  imports: [AlgorithmModule, WinningNumberModule],
  controllers: [ReliabilityController],
  providers: [
    ReliabilityService,
    {
      provide: RELIABILITY_REPOSITORY_TOKEN,
      useClass: InfraReliabilityRepository,
    },
  ],
  exports: [ReliabilityService],
})
export class ReliabilityModule {}
