import { Module } from '@nestjs/common';
import { WinningNumberModule } from './number/winning-number.module';
import { LotteryAnalysisModule } from './lottery-analysis/lottery-analysis.module';
import { UserModule } from './user/user.module';
import { ManagerModule } from './manager/manager.module';

@Module({
  imports: [
    WinningNumberModule,
    LotteryAnalysisModule,
    UserModule,
    ManagerModule,
  ],
  exports: [
    WinningNumberModule,
    LotteryAnalysisModule,
    UserModule,
    ManagerModule,
  ],
})
export class RootModule {}
