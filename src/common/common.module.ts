import { Global, Module } from '@nestjs/common';
import { RequestParser } from './utils/request-parser';
import { AdminGuard } from './guards/admin.guard';
import { SystemStatusService } from './utils/system-status/system-status.service';
import { SystemStatusController } from './utils/system-status/system-status.controller';
import { UserCleanupTask } from './tasks/user-cleanup.task';

@Global()
@Module({
  controllers: [SystemStatusController],
  providers: [RequestParser, AdminGuard, SystemStatusService, UserCleanupTask],
  exports: [RequestParser, AdminGuard, SystemStatusService, UserCleanupTask],
})
export class CommonModule {}
