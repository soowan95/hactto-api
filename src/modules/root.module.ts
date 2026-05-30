import { Module } from '@nestjs/common';
import { WinningNumberModule } from './winning-number/winning-number.module';
import { AlgorithmAnalysisModule } from './algorithm-analysis/algorithm-analysis.module';

@Module({
  imports: [WinningNumberModule, AlgorithmAnalysisModule],
  exports: [WinningNumberModule, AlgorithmAnalysisModule],
})
export class RootModule {}
