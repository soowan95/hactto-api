import { Module } from '@nestjs/common';
import { RootModule } from './modules/root.module';
import { RedisModule } from './helpers/redis/redis.module';
import { TaskService } from './common/tasks/task.service';
import { ScheduleModule } from '@nestjs/schedule';
import { AdminGuard } from './common/guards/admin.guard';
import { AllowedClientGuard } from './common/guards/allowed-client.guard';

@Module({
  imports: [ScheduleModule.forRoot(), RootModule, RedisModule],
  providers: [TaskService, AdminGuard, AllowedClientGuard],
})
export class AppModule {}
