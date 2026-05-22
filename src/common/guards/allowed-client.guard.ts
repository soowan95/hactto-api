import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { RedisService } from '../../helpers/redis/redis.service';

@Injectable()
export class AllowedClientGuard implements CanActivate {
  constructor(private readonly redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const ip =
      (request.headers['x-forwarded-for'] as string) ||
      request.socket.remoteAddress;
    const clientIp = ip.includes(',') ? ip.split(',')[0].trim() : ip;

    const isAllowedIp = await this.redisService.isMemberOfSet(
      'allowed:ips',
      clientIp,
    );
    if (!isAllowedIp)
      throw new ForbiddenException('Access denied from this IP address.');

    return true;
  }
}
