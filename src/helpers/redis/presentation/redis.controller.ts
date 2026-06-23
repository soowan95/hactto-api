import { RedisService } from '../application/redis.service';
import { Controller, Delete, Get, Logger, Query } from '@nestjs/common';
import * as crypto from 'crypto';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { RedisManager } from '../../../common/decorators/redis-manager.decorator';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequestParser } from '../../../common/utils/request-parser';
import { HonService } from '../../../modules/user/application/hon.service';

@ApiTags('- Redis')
@Controller()
export class RedisController {
  private readonly logger = new Logger(RedisController.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly requestParser: RequestParser,
    private readonly honService: HonService,
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
    hon?: any | null;
    subscription?: any | null;
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

    const hon = await this.honService.getHon(visitorId);
    const subscription = await this.honService.getSubscription(visitorId);

    if (queryMk) {
      const isValidMasterKey =
        await this.redisService.validateMasterKey(queryMk);
      return {
        allowed: isValidMasterKey,
        pending: false,
        ip,
        visitorId,
        hon,
        subscription,
      };
    }

    return { allowed: true, pending: false, ip, visitorId, hon, subscription };
  }
}
