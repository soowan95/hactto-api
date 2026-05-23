import { Module } from '@nestjs/common';
import { RootModule } from './modules/root.module';
import { RedisModule } from './helpers/redis/redis.module';
import { TaskService } from './common/tasks/task.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [ScheduleModule.forRoot(), RootModule, RedisModule],
  providers: [TaskService],
})
export class AppModule {}
