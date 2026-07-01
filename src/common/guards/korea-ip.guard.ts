import {
  CanActivate,
  ExecutionContext,
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
import { Response } from 'express';
import * as crypto from 'crypto';
import { prisma } from '../../libs/prisma';

@Injectable({ scope: Scope.REQUEST })
export class KoreaIpGuard implements CanActivate {
  private readonly logger = new Logger(KoreaIpGuard.name);

  constructor(
    @Inject(VISITOR_REPOSITORY_TOKEN)
    private readonly repository: IVisitorRepository,
    private readonly requestParser: RequestParser,
    private readonly redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    if (
      request &&
      request.path &&
      request.path.endsWith('/manager/inquiries') &&
      (request.method === 'POST' || request.method === 'GET')
    ) {
      return true;
    }

    const masterKey = this.requestParser.getMasterKey();
    if (masterKey) {
      const isValidMasterKey =
        await this.redisService.validateMasterKey(masterKey);
      if (isValidMasterKey) {
        return true;
      }
    }

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

    let visitorId = this.requestParser.getVisitorId();
    if (!visitorId) {
      visitorId = crypto
        .createHash('sha256')
        .update(ip)
        .digest('hex')
        .substring(0, 16);
    }

    if (visitorId) {
      const blockedRedisKey = `visitor-blocked:${visitorId}`;
      let isBlockedCache = await this.redisService.get(blockedRedisKey);

      if (isBlockedCache === 'true') {
        throw new ForbiddenException({
          message: '차단된 사용자입니다.',
          ip,
          visitorId,
        });
      }

      const redisKey = `visitor-ip:${visitorId}`;
      let savedIp = await this.redisService.get(redisKey);
      let visitorEntity: any = null;

      // redis cache 에 없으면 DB 조회.
      if (!savedIp || isBlockedCache === null) {
        visitorEntity = await this.repository.findById(visitorId);
        if (visitorEntity) {
          savedIp = visitorEntity.ip;
          const activeBlock = await prisma.block.findFirst({
            where: {
              visitorId,
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
          });
          isBlockedCache = activeBlock ? 'true' : 'false';
          await this.redisService.set(
            blockedRedisKey,
            isBlockedCache,
            86400 * 7,
          ); // 7일 캐싱
        }
      }

      if (isBlockedCache === 'true') {
        throw new ForbiddenException({
          message: '차단된 사용자입니다.',
          ip,
          visitorId,
        });
      }

      if (!savedIp) {
        // 처음 진입 시에는 헤더만 설정하고 실제 저장은 동의 후 register API에서 진행
        const response = context.switchToHttp().getResponse<Response>();
        if (response && typeof response.setHeader === 'function') {
          response.setHeader('x-first-visit', 'true');
        }
      } else if (savedIp === '0.0.0.0') {
        // 결제 모듈 등에서 0.0.0.0으로 임시 저장된 경우, 현재 실제 IP로 업데이트 후 통과
        await this.repository.updateIp(visitorId, ip);
        await this.redisService.set(redisKey, ip, 86400 * 30);
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

    // AWS WAF가 로드밸런서(ALB) 앞단에서 한국 IP 검증 및 차단을 수행하므로
    // 애플리케이션 레벨의 국가 코드 검사는 제거합니다. (cf-ipcountry는 Cloudflare 전용)

    return true;
  }
}
