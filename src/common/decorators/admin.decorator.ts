import { applyDecorators, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../guards/admin.guard';
import { ApiQuery } from '@nestjs/swagger';

export function Admin() {
  return applyDecorators(
    ApiQuery({
      name: 'mk',
      required: true,
      description: 'Master Key for Admin Authentication',
    }),
    UseGuards(AdminGuard),
  );
}
