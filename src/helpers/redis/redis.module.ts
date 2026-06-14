import { Global, Module } from '@nestjs/common';
import { RedisService } from './application/redis.service';
import { RedisController } from './presentation/redis.controller';
import { UserModule } from '../../modules/user/user.module';

@Global()
@Module({
  imports: [UserModule],
  controllers: [RedisController],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
