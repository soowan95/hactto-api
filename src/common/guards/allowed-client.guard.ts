import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { RedisService } from '../../helpers/redis/application/redis.service';
import { Reflector } from '@nestjs/core';
import { IS_GUEST_ALLOWED_KEY } from '../decorators/guest-allowed.decorator';
import { RequestParser } from '../utils/request-parser';

@Injectable()
export class AllowedClientGuard implements CanActivate {
  private readonly logger = new Logger(AllowedClientGuard.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly reflector: Reflector,
    private readonly requestParser: RequestParser,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 게스트 전용 엔드포인트 접근 체크
    const visitorId = this.requestParser.getVisitorId();
    const isGuestAllowed = this.reflector.getAllAndOverride<boolean>(
      IS_GUEST_ALLOWED_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (visitorId === 'guest' && isGuestAllowed) {
      return true;
    }

    let ip = '';
    try {
      ip = this.requestParser.getIpOrThrow();
    } catch {
      throw new ForbiddenException('IP 주소를 식별할 수 없습니다.');
    }

    const isAllowedIp = await this.redisService.isMemberOfSet(
      'allowed:ips',
      ip,
    );

    if (isAllowedIp) {
      return true;
    }

    const token = this.requestParser.getCookies()['allowed_token'];

    if (token) {
      const isValidToken = await this.redisService.verifyAccessPayload(token);
      if (isValidToken) {
        this.logger.log(
          `Cookie authentication successful: automatically registering new IP (${ip}) to Redis whitelist.`,
        );
        await this.redisService.addToSet('allowed:ips', ip);
        return true;
      }
    }

    this.logger.warn(`Access denied for IP: ${ip}`);
    throw new ForbiddenException('Access denied from this IP address.');
  }
}
