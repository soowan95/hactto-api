import { RedisService } from '../application/redis.service';
import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Logger,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { RedisManager } from '../../../common/decorators/redis-manager.decorator';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CreateAllowedIpRequestDto } from './dtos/requests/create-allowed-ip-request.dto';
import { CreateMasterKeyRequestDto } from './dtos/requests/create-master-key-request.dto';
import { RequestParser } from '../../../common/utils/request-parser';

@ApiTags('- Allowed Client')
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

  @ApiOperation({ summary: 'Get allowed values' })
  @RedisManager()
  @Get('admin/whitelist/read')
  @ResponseMessage('success.read')
  async getValue(@Query('t') target: string): Promise<string[]> {
    const key: string = `allowed:${target}s`;
    return await this.redisService.getFromSet(key);
  }

  @ApiOperation({ summary: 'Add allowed IP' })
  @RedisManager()
  @Post('admin/whitelist/ip')
  @ResponseMessage('success.add.ip')
  async addIp(@Body() body: CreateAllowedIpRequestDto): Promise<void> {
    const { ip } = body;
    await this.redisService.addToSet('allowed:ips', ip);
  }

  @ApiOperation({ summary: 'Add allowed master key' })
  @RedisManager()
  @Post('admin/whitelist/mk')
  @ResponseMessage('success.add.mk')
  async addMasterKey(@Body() body: CreateMasterKeyRequestDto): Promise<void> {
    const { mk } = body;
    await this.redisService.addToSet('allowed:mks', mk);
  }

  @ApiOperation({ summary: 'Remove allowed IP' })
  @ApiParam({ name: 'ip' })
  @RedisManager()
  @Delete('admin/whitelist/ip/:ip')
  @ResponseMessage('success.remove.ip')
  async removeIp(@Param('ip') ip: string): Promise<void> {
    await this.redisService.removeFromSet('allowed:ips', ip);
    await this.redisService.removeFromSet('pending:ips', ip);
  }

  @ApiOperation({ summary: 'Remove allowed master key' })
  @ApiParam({ name: 'mk' })
  @RedisManager()
  @Delete('admin/whitelist/mk/:mk')
  @ResponseMessage('success.remove.mk')
  async removeMasterKey(@Param('mk') mk: string): Promise<void> {
    await this.redisService.removeFromSet('allowed:mks', mk);
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
      let isValidMasterKey = await this.redisService.isMemberOfSet(
        'allowed:mks',
        queryMk,
      );
      if (!isValidMasterKey) {
        isValidMasterKey = await this.redisService.isMemberOfSet(
          'manager:k',
          queryMk,
        );
      }
      if (isValidMasterKey) {
        return { allowed: true, pending: false, ip, visitorId };
      }
    }

    const isAllowedIp = await this.redisService.isMemberOfSet(
      'allowed:ips',
      ip,
    );

    if (isAllowedIp) {
      return { allowed: true, pending: false, ip, visitorId };
    }

    const token = this.requestParser.getCookies()['allowed_token'];

    if (token) {
      const isValidToken = await this.redisService.verifyAccessPayload(token);
      if (isValidToken) {
        await this.redisService.addToSet('allowed:ips', ip);
        return { allowed: true, pending: false, ip, visitorId };
      }
    }

    const isPendingIp = await this.redisService.isMemberOfSet(
      'pending:ips',
      ip,
    );

    return { allowed: false, pending: isPendingIp, ip, visitorId };
  }

  @ApiOperation({ summary: 'Request access permission' })
  @Post('request-access')
  @ResponseMessage('success.request.access')
  async requestAccess(): Promise<void> {
    let ip = this.requestParser.getIpOrThrow();

    // 대한민국 IP 여부 검증 (Cloudflare 헤더 검증)
    if (process.env.NODE_ENV !== 'localhost') {
      const country = this.requestParser.getHeaders('cf-ipcountry') as string;
      if (!country || country.toUpperCase() !== 'KR') {
        this.logger.warn(
          `Access request blocked: IP ${ip} is from country ${
            country || 'unknown'
          }`,
        );
        throw new ForbiddenException('대한민국 IP에서만 접근이 가능합니다.');
      }
    }

    // Redis 승인 대기열에 IP 추가 (수동 승인용)
    await this.redisService.addToSet('pending:ips', ip);
    this.logger.log(
      `Access requested: registered IP (${ip}) to Redis pending:ips queue.`,
    );
  }

  @ApiOperation({ summary: 'Get pending access requests' })
  @RedisManager()
  @Get('admin/whitelist/pending')
  @ResponseMessage('success.read.pending')
  async getPendingIps(): Promise<string[]> {
    return await this.redisService.getFromSet('pending:ips');
  }

  @ApiOperation({ summary: 'Approve pending IP request' })
  @RedisManager()
  @Post('admin/whitelist/approve')
  @ResponseMessage('success.approve.ip')
  async approveIp(@Body() body: CreateAllowedIpRequestDto): Promise<void> {
    const { ip } = body;
    // 대기열에서 삭제
    await this.redisService.removeFromSet('pending:ips', ip);
    // 화이트리스트에 추가
    await this.redisService.addToSet('allowed:ips', ip);
    this.logger.log(`IP ${ip} approved by administrator.`);
  }

  @ApiOperation({ summary: 'Reject pending IP request' })
  @RedisManager()
  @Post('admin/whitelist/reject')
  @ResponseMessage('success.reject.ip')
  async rejectIp(@Body() body: CreateAllowedIpRequestDto): Promise<void> {
    const { ip } = body;
    // 대기열에서만 삭제
    await this.redisService.removeFromSet('pending:ips', ip);
    this.logger.log(`IP ${ip} rejected by administrator.`);
  }
}
