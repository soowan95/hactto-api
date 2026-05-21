import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { RedisService } from '../../helpers/redis/redis.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const masterKey: string = request.query.mk;

    if (masterKey) {
      // Check master key
      let isValidMasterKey: boolean = await this.redisService.isMemberOfSet(
        'allowed:mks',
        masterKey,
      );
      // Check redis manager key
      if (!isValidMasterKey)
        isValidMasterKey = await this.redisService.isMemberOfSet(
          'manager:k',
          masterKey,
        );
      if (!isValidMasterKey) throw new ForbiddenException('Invalid Master Key');
      return true;
    }

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
