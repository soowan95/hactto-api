import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { RedisService } from '../../helpers/redis/redis.service';
import { Reflector } from '@nestjs/core';
import { IS_GUEST_ALLOWED_KEY } from '../decorators/guest-allowed.decorator';

@Injectable()
export class AllowedClientGuard implements CanActivate {
  private readonly logger = new Logger(AllowedClientGuard.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 게스트 전용 엔드포인트 접근 체크
    const visitorId = request.query?.visitorId || request.body?.visitorId;
    const isGuestAllowed = this.reflector.getAllAndOverride<boolean>(
      IS_GUEST_ALLOWED_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (visitorId === 'guest' && isGuestAllowed) {
      return true;
    }

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

    const isAllowedIp = await this.redisService.isMemberOfSet(
      'allowed:ips',
      ip,
    );

    if (isAllowedIp) {
      return true;
    }

    const cookieHeader = request.headers.cookie;
    const cookies = this.parseCookies(cookieHeader);
    const token = cookies['allowed_token'];

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

  private parseCookies(cookieHeader?: string): Record<string, string> {
    if (!cookieHeader) return {};
    const list: Record<string, string> = {};
    cookieHeader.split(';').forEach((cookie) => {
      const parts = cookie.split('=');
      const name = parts.shift()?.trim();
      const value = parts.join('=').trim();
      if (name) {
        list[name] = decodeURIComponent(value);
      }
    });
    return list;
  }
}
