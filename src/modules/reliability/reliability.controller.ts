import { Controller, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReliabilityService } from './reliability.service';
import { Admin } from '../../common/decorators/admin.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { ReliabilityAnalyzeRequestDto } from './dtos/requests/reliability-analyze-request.dto';

@ApiTags('- Reliability')
@Controller('api/rb')
export class ReliabilityController {
  constructor(private readonly reliabilityService: ReliabilityService) {}

  @ApiOperation({
    summary: 'Analyze the reliability of the winning numbers',
  })
  @Admin()
  @ResponseMessage('success.analyze')
  @Post('analyze')
  async analyze(@Query() request: ReliabilityAnalyzeRequestDto): Promise<void> {
    return await this.reliabilityService.analyze(request.t);
  }
}
