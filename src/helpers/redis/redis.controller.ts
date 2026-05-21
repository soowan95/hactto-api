import { RedisService } from './redis.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { RedisManager } from '../../common/decorators/redis-manager.decorator';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CreateAllowedIpRequestDto } from './dtos/requests/create-allowed-ip-request.dto';
import { CreateMasterKeyRequestDto } from './dtos/requests/create-master-key-request.dto';

@ApiTags('- Allowed Client')
@Controller()
export class RedisController {
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
}
