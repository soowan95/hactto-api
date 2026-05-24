import { Module } from '@nestjs/common';
import { ReliabilityController } from './reliability.controller';
import { ReliabilityService } from './reliability.service';
import { AlgorithmModule } from '../algorithm/algorithm.module';
import { WinningNumberModule } from '../winning-number/winning-number.module';

@Module({
  imports: [AlgorithmModule, WinningNumberModule],
  controllers: [ReliabilityController],
  providers: [ReliabilityService],
})
export class ReliabilityModule {}
