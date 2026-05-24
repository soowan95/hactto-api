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

    let ip =
      (request.headers['x-forwarded-for'] as string) ||
      request.socket.remoteAddress;

    if (!ip) {
      throw new ForbiddenException('IP 주소를 식별할 수 없습니다.');
    }

    if (ip.includes(',')) {
      ip = ip.split(',')[0].trim();
    }

    if (ip.startsWith('::ffff:')) {
      ip = ip.replace('::ffff:', '');
    }

    console.log('최종 추출된 Client IP:', ip);

    const isAllowedIp = await this.redisService.isMemberOfSet(
      'allowed:ips',
      ip,
    );

    if (!isAllowedIp)
      throw new ForbiddenException('Access denied from this IP address.');

    return true;
  }
}
