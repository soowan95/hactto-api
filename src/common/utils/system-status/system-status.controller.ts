import { Controller, Get, Post, Query } from '@nestjs/common';

import { SystemStatusService } from './system-status.service';
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
    const detailed = this.systemStatusService.getDetailedStatus();
    return {
      inProgress: detailed.inProgress,
      progress: detailed.progress,
      message: detailed.message,
      estimatedCompletionTime: detailed.estimatedCompletionTime,
    };
  }
}
