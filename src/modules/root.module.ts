import { Module } from '@nestjs/common';
import { WinningNumberModule } from './number/winning-number.module';
import { LotteryAnalysisModule } from './lottery-analysis/lottery-analysis.module';
import { UserModule } from './user/user.module';
import { ManagerModule } from './manager/manager.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { ScheduleModule } from '@nestjs/schedule';

import { PolicyModule } from './policy/policy.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    WinningNumberModule,
    LotteryAnalysisModule,
    UserModule,
    ManagerModule,
    AuthModule,
    MailModule,
    PolicyModule,
  ],
  providers: [],
  exports: [
    WinningNumberModule,
    LotteryAnalysisModule,
    UserModule,
    ManagerModule,
    PolicyModule,
  ],
})
export class RootModule {}
