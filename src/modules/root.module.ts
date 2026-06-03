import { Module } from '@nestjs/common';
import { WinningNumberModule } from './number/winning-number.module';
import { LotteryAnalysisModule } from './lottery-analysis/lottery-analysis.module';

@Module({
  imports: [WinningNumberModule, LotteryAnalysisModule],
  exports: [WinningNumberModule, LotteryAnalysisModule],
})
export class RootModule {}
