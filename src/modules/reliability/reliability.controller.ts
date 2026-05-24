import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReliabilityService } from './reliability.service';
import { Admin } from '../../common/decorators/admin.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { ReliabilityAnalyzeRequestDto } from './dtos/requests/reliability-analyze-request.dto';
import { Permission } from '../../common/decorators/permission.decorator';
import { ReliabilityAverageRequestDto } from './dtos/requests/reliability-average-request.dto';
import { ReliabilityAverageResponseDto } from './dtos/responses/reliability-average-response.dto';
import { plainToInstance } from 'class-transformer';

@ApiTags('- Reliability')
@Controller('api/rb')
export class ReliabilityController {
  constructor(private readonly reliabilityService: ReliabilityService) {}

  @ApiOperation({
    summary: 'Analyze the reliability of the algorithm',
  })
  @Admin()
  @ResponseMessage('success.analyze')
  @Post('analyze')
  async analyze(@Query() request: ReliabilityAnalyzeRequestDto): Promise<void> {
    return await this.reliabilityService.analyze(request.t);
  }

  @ApiOperation({
    summary: 'Get the average reliability of the algorithm',
  })
  @ApiOkResponse({ type: ReliabilityAverageResponseDto })
  @Permission()
  @ResponseMessage('success.read')
  @Get('avg')
  async getAverage(
    @Query() request: ReliabilityAverageRequestDto,
  ): Promise<ReliabilityAverageResponseDto> {
    const result: ReliabilityAverageResponseDto =
      await this.reliabilityService.getAverageScore(request.t);
    return plainToInstance(ReliabilityAverageResponseDto, result);
  }
}
