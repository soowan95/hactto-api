import { Global, Module } from '@nestjs/common';
import { RedisService } from './application/redis.service';
import { RedisController } from './presentation/redis.controller';

@Global()
@Module({
  controllers: [RedisController],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
