import { Module } from '@nestjs/common';
import { WinningNumberModule } from './number/winning-number.module';
import { LotteryAnalysisModule } from './lottery-analysis/lottery-analysis.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [WinningNumberModule, LotteryAnalysisModule, UserModule],
  exports: [WinningNumberModule, LotteryAnalysisModule, UserModule],
})
export class RootModule {}
