import {
  Controller,
  Get,
  Post,
  Query,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SystemStatusService } from '../services/system-status.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('- System Status')
@Controller('system/status')
export class SystemStatusController {
  constructor(private readonly systemStatusService: SystemStatusService) {}

  @ApiOperation({
    summary: 'TEST ONLY: Toggle system status manually',
  })
  @Post('test-toggle')
  async toggleStatus(@Query('inProgress') inProgress: string) {
    const status = inProgress === 'true';
    await this.systemStatusService.setAnalysisStatus(status);
    return { success: true, status };
  }

  @ApiOperation({
    summary: 'Get system analysis status',
  })
  @Get()
  async getStatus() {
    // Sync with Redis to ensure we have the latest status
    await this.systemStatusService.syncFromRedis();
    return {
      inProgress: this.systemStatusService.getAnalysisStatus(),
    };
  }

  @ApiOperation({
    summary: 'Stream system analysis status changes using SSE',
  })
  @Sse('sse')
  sse(): Observable<MessageEvent> {
    return this.systemStatusService.statusStream$.pipe(
      map(
        (inProgress) =>
          ({
            data: { inProgress },
          }) as MessageEvent,
      ),
    );
  }
}
