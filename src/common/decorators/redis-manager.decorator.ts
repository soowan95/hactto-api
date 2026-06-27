import { applyDecorators, UseGuards } from '@nestjs/common';
import { RedisManagerGuard } from '../guards/redis-manager.guard';
import { ApiQuery } from '@nestjs/swagger';

export function RedisManager() {
  return applyDecorators(
    ApiQuery({
      name: 'mk',
      required: true,
      description: 'Master Key for Admin Authentication',
    }),
    UseGuards(RedisManagerGuard),
  );
}
