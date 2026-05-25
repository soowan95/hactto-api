import { RedisService } from './redis.service';
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
  Req,
  Res,
} from '@nestjs/common';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { RedisManager } from '../../common/decorators/redis-manager.decorator';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CreateAllowedIpRequestDto } from './dtos/requests/create-allowed-ip-request.dto';
import { CreateMasterKeyRequestDto } from './dtos/requests/create-master-key-request.dto';
import { Request, Response } from 'express';

@ApiTags('- Allowed Client')
@Controller()
export class RedisController {
  private readonly logger = new Logger(RedisController.name);

  constructor(private readonly redisService: RedisService) {}

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

  @ApiOperation({ summary: 'Reset all redis database' })
  @RedisManager()
  @Delete('redis/all')
  @ResponseMessage('success.reset.all.redis')
  async resetAllDatabase(): Promise<void> {
    await this.redisService.resetAll();
  }

  @ApiOperation({ summary: 'Check if current IP is allowed' })
  @Get('check-ip')
  @ResponseMessage('success.check.ip')
  async checkIp(
    @Req() request: Request,
  ): Promise<{ allowed: boolean; ip: string }> {
    let ip =
      (request.headers['x-forwarded-for'] as string) ||
      request.socket.remoteAddress;

    if (!ip) {
      return { allowed: false, ip: 'unknown' };
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
      return { allowed: true, ip };
    }

    const cookieHeader = request.headers.cookie;
    const cookies = this.parseCookies(cookieHeader);
    const token = cookies['allowed_token'];

    if (token) {
      const isValidToken = await this.redisService.verifyAccessPayload(token);
      if (isValidToken) {
        await this.redisService.addToSet('allowed:ips', ip);
        return { allowed: true, ip };
      }
    }

    return { allowed: false, ip };
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

  @ApiOperation({ summary: 'Request access permission' })
  @Post('request-access')
  @ResponseMessage('success.request.access')
  async requestAccess(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
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

    // 대한민국 IP 여부 검증 (Cloudflare 헤더 검증)
    if (process.env.NODE_ENV !== 'localhost') {
      const country = request.headers['cf-ipcountry'] as string;
      if (!country || country.toUpperCase() !== 'KR') {
        this.logger.warn(
          `Access request blocked: IP ${ip} is from country ${
            country || 'unknown'
          }`,
        );
        throw new ForbiddenException('대한민국 IP에서만 접근이 가능합니다.');
      }
    }

    // Redis 화이트리스트에 IP 추가
    await this.redisService.addToSet('allowed:ips', ip);
    this.logger.log(
      `Access granted: registered IP (${ip}) to Redis and issued session cookie.`,
    );

    // 모바일 지원용 세션 쿠키 토큰 발급
    const token = await this.redisService.signAccessPayload();
    response.cookie('allowed_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'localhost',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
    });
  }
}
