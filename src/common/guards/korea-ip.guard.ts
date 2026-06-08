import {
  CanActivate,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  Scope,
} from '@nestjs/common';
import { RequestParser } from '../utils/request-parser';
import { RedisService } from '../../helpers/redis/application/redis.service';
import {
  IVisitorRepository,
  VISITOR_REPOSITORY_TOKEN,
} from '../../modules/user/domain/ports/visitor.port';

@Injectable({ scope: Scope.REQUEST })
export class KoreaIpGuard implements CanActivate {
  private readonly logger = new Logger(KoreaIpGuard.name);

  constructor(
    @Inject(VISITOR_REPOSITORY_TOKEN)
    private readonly repository: IVisitorRepository,
    private readonly requestParser: RequestParser,
    private readonly redisService: RedisService,
  ) {}

  async canActivate(): Promise<boolean> {
    let ip = '';
    try {
      ip = this.requestParser.getIpOrThrow();
    } catch {
      if (
        process.env.NODE_ENV === 'localhost' ||
        process.env.NODE_ENV === 'development' ||
        process.env.NODE_ENV === 'dev'
      ) {
        return true;
      }
      throw new ForbiddenException('IP 주소를 식별할 수 없습니다.');
    }

    const visitorId = this.requestParser.getVisitorId();

    if (visitorId) {
      const redisKey = `visitor-ip:${visitorId}`;
      let savedIp = await this.redisService.get(redisKey);
      // redis cache 에 없으면 DB 조회.
      if (!savedIp) {
        const visitorEntity = await this.repository.findById(visitorId);
        if (visitorEntity) savedIp = visitorEntity.ip;
      }

      if (!savedIp) {
        // 처음 페이지 진입했을 때 redis 에 ip:visitorId 없으면 저장
        await this.redisService.set(redisKey, ip, 604800); // 7 days expiration
        await this.repository.insert(visitorId, ip); // DB 에 저장.
      } else if (savedIp !== ip) {
        // 그 다음부터는 visitorId 검증해서 다른 IP 에서는 해당 visitorId 사용못하게 처리
        this.logger.warn(
          `Visitor ID hijacking detected! ID: ${visitorId}. Saved IP: ${savedIp}, Current IP: ${ip}`,
        );
        throw new ForbiddenException(
          '허용되지 않은 접근 주소입니다. (IP 불일치)',
        );
      }
    }

    // 로컬 환경 및 개발 환경에서는 국가(KR) IP 검증을 제외합니다.
    if (process.env.NODE_ENV === 'localhost') return true;

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
