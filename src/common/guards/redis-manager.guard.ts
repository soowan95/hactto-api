import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { RedisService } from '../../helpers/redis/application/redis.service';

@Injectable()
export class RedisManagerGuard implements CanActivate {
  constructor(private readonly redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const masterKey: string =
      (request.query.mk as string) ||
      (request.headers['x-master-key'] as string);

    if (!masterKey) throw new BadRequestException('Master key is required');

    const isManagerOfRedis: boolean =
      await this.redisService.validateMasterKey(masterKey);

    if (!isManagerOfRedis)
      throw new ForbiddenException('Access denied to managing redis.');

    return true;
  }
}
