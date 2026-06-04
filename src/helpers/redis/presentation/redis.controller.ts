import { RedisService } from '../application/redis.service';
import { Controller, Delete, Get, Logger, Query } from '@nestjs/common';
import * as crypto from 'crypto';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { RedisManager } from '../../../common/decorators/redis-manager.decorator';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequestParser } from '../../../common/utils/request-parser';

@ApiTags('- Redis')
@Controller()
export class RedisController {
  private readonly logger = new Logger(RedisController.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly requestParser: RequestParser,
  ) {}

  @ApiOperation({ summary: 'Generate master key' })
  @Get('gk')
  @ResponseMessage('success.generate')
  async generateMasterKey(): Promise<string> {
    return await this.redisService.generateMasterKey();
  }

  @ApiOperation({ summary: 'Reset current redis database' })
  @RedisManager()
  @Delete('redis')
  @ResponseMessage('success.reset.redis')
  async resetCurrentDatabase(): Promise<void> {
    await this.redisService.reset();
  }

  @ApiOperation({ summary: 'Check if current IP is allowed' })
  @Get('check-ip')
  @ResponseMessage('success.check.ip')
  async checkIp(@Query('mk') queryMk?: string): Promise<{
    allowed: boolean;
    pending: boolean;
    ip: string;
    visitorId: string;
  }> {
    let ip = '';
    try {
      ip = this.requestParser.getIpOrThrow();
    } catch {
      return { allowed: false, pending: false, ip: 'unknown', visitorId: '' };
    }

    const visitorId = crypto
      .createHash('sha256')
      .update(ip)
      .digest('hex')
      .substring(0, 16);

    // 마스터 키(?mk=키) 유효성 검증 우선 처리
    if (queryMk) {
      const isValidMasterKey = await this.redisService.isMemberOfSet(
        'manager:k',
        queryMk,
      );
      return { allowed: isValidMasterKey, pending: false, ip, visitorId };
    }

    return { allowed: true, pending: false, ip, visitorId };
  }
}
