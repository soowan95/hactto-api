import {
  CanActivate,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { RequestParser } from '../utils/request-parser';

@Injectable()
export class KoreaIpGuard implements CanActivate {
  private readonly logger = new Logger(KoreaIpGuard.name);

  constructor(private readonly requestParser: RequestParser) {}

  async canActivate(): Promise<boolean> {
    // 로컬 환경 및 개발 환경에서는 IP 검증을 제외합니다.
    if (
      process.env.NODE_ENV === 'localhost' ||
      process.env.NODE_ENV === 'development' ||
      process.env.NODE_ENV === 'dev'
    ) {
      return true;
    }

    let ip = '';
    try {
      ip = this.requestParser.getIpOrThrow();
    } catch {
      throw new ForbiddenException('IP 주소를 식별할 수 없습니다.');
    }

    // IP 자체가 로컬호스트 루프백 주소인 경우 통과
    if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') {
      return true;
    }

    const country = this.requestParser.getHeaders('cf-ipcountry') as string;
    if (!country || country.toUpperCase() !== 'KR') {
      this.logger.warn(
        `Access request blocked: IP ${ip} is from country ${
          country || 'unknown'
        }`,
      );
      throw new ForbiddenException('대한민국 IP에서만 접근이 가능합니다.');
    }

    return true;
  }
}
