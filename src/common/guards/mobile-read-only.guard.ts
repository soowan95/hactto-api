import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class MobileReadOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const userAgent = request.headers['user-agent'] || '';

    // Check if the request is from a mobile device
    const isMobile = /mobile|android|iphone|ipad|ipod/i.test(userAgent);

    if (isMobile) {
      // Allow only GET methods
      // Allow visitor/register so they can be initialized (WelcomeModal won't loop)
      if (
        request.method !== 'GET' &&
        !request.url.includes('/visitor/register')
      ) {
        throw new ForbiddenException(
          '모바일에서는 조회(GET) 기능만 이용할 수 있습니다.',
        );
      }
    }

    return true;
  }
}
