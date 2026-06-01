import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { RootModule } from './modules/root.module';
import { RedisModule } from './helpers/redis/redis.module';
import { TaskService } from './common/tasks/task.service';
import { ScheduleModule } from '@nestjs/schedule';
import { AdminGuard } from './common/guards/admin.guard';
import { APP_GUARD } from '@nestjs/core';
import { KoreaIpGuard } from './common/guards/korea-ip.guard';
import expressStatusMonitor from 'express-status-monitor';
import { StatusMonitorMiddleware } from './common/middlewares/status-monitor.middleware';
import { CommonModule } from './common/common.module';

@Module({
  imports: [ScheduleModule.forRoot(), RootModule, RedisModule, CommonModule],
  providers: [
    TaskService,
    AdminGuard,
    {
      provide: APP_GUARD,
      useClass: KoreaIpGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(StatusMonitorMiddleware).forRoutes('status');

    consumer
      .apply(
        expressStatusMonitor({
          path: '/',
          theme: '../../../../../src/common/middlewares/status-monitor.css',
        }),
      )
      .forRoutes('status');
  }
}
