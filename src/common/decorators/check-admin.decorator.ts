import { applyDecorators, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../guards/admin.guard';
import { ApiQuery } from '@nestjs/swagger';

export function CheckAdmin() {
  return applyDecorators(
    ApiQuery({
      name: 'mk',
      required: false,
      description: 'Master Key for Admin Authentication',
    }),
    UseGuards(AdminGuard),
  );
}
