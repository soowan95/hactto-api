import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { RedisService } from '../../helpers/redis/redis.service';

@Injectable()
export class RedisManagerGuard implements CanActivate {
  constructor(private readonly redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const masterKey: string = request.query.rmk;

    if (!masterKey) throw new BadRequestException('Master key is required');

    const justCreated: boolean = await this.redisService.isJustCreated();
    if (justCreated) {
      await this.redisService.addToSet('manager:k', masterKey);
      return true;
    }

    const isManagerOfRedis: boolean = await this.redisService.isMemberOfSet(
      'manager:k',
      masterKey,
    );

    if (!isManagerOfRedis)
      throw new ForbiddenException('Access denied to managing redis.');

    return true;
  }
}
