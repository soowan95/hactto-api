import { Global, Module } from '@nestjs/common';
import { RequestParser } from './utils/request-parser';
import { AdminGuard } from './guards/admin.guard';
import { SystemStatusService } from './utils/system-status/system-status.service';
import { SystemStatusController } from './utils/system-status/system-status.controller';

@Global()
@Module({
  controllers: [SystemStatusController],
  providers: [RequestParser, AdminGuard, SystemStatusService],
  exports: [RequestParser, AdminGuard, SystemStatusService],
})
export class CommonModule {}
