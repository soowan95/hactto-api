import { Global, Module } from '@nestjs/common';
import { RequestParser } from './utils/request-parser';
import { AllowedClientGuard } from './guards/allowed-client.guard';
import { AdminGuard } from './guards/admin.guard';
import { SystemStatusService } from './services/system-status.service';
import { SystemStatusController } from './controllers/system-status.controller';

@Global()
@Module({
  controllers: [SystemStatusController],
  providers: [
    RequestParser,
    AllowedClientGuard,
    AdminGuard,
    SystemStatusService,
  ],
  exports: [RequestParser, AllowedClientGuard, AdminGuard, SystemStatusService],
})
export class CommonModule {}
