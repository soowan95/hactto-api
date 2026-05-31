import { Global, Module } from '@nestjs/common';
import { RequestParser } from './utils/request-parser';
import { AllowedClientGuard } from './guards/allowed-client.guard';
import { AdminGuard } from './guards/admin.guard';

@Global()
@Module({
  providers: [RequestParser, AllowedClientGuard, AdminGuard],
  exports: [RequestParser, AllowedClientGuard, AdminGuard],
})
export class CommonModule {}
