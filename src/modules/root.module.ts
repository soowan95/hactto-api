import { Module } from '@nestjs/common';
import { WinningNumberModule } from './winning-number/winning-number.module';
import { ReliabilityModule } from './reliability/reliability.module';
import { AlgorithmModule } from './algorithm/algorithm.module';

@Module({
  imports: [WinningNumberModule, ReliabilityModule, AlgorithmModule],
  exports: [WinningNumberModule, ReliabilityModule],
})
export class RootModule {}
