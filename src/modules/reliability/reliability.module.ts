import { Module } from '@nestjs/common';
import { ReliabilityController } from './reliability.controller';
import { ReliabilityService } from './reliability.service';
import { AlgorithmModule } from '../algorithm/algorithm.module';

@Module({
  imports: [AlgorithmModule],
  controllers: [ReliabilityController],
  providers: [ReliabilityService],
  exports: [ReliabilityService],
})
export class ReliabilityModule {}
