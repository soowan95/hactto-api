import { Module } from '@nestjs/common';
import { RootModule } from './modules/root.module';
import { RedisModule } from './helpers/redis/redis.module';

@Module({
  imports: [RootModule, RedisModule],
})
export class AppModule {}
