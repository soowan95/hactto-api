import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { AdminOrAllowedClientGuard } from '../guards/admin-or-allowed-client.guard';

export function Permission() {
  return applyDecorators(
    ApiQuery({
      name: 'mk',
      required: false,
      description: 'Master Key for Admin Authentication',
    }),
    UseGuards(AdminOrAllowedClientGuard),
  );
}
