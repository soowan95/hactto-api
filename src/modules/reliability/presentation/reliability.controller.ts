import { Controller, Get, Post, Query, ParseEnumPipe } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ReliabilityService } from '../application/reliability.service';
import { Admin } from '../../../common/decorators/admin.decorator';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { Permission } from '../../../common/decorators/permission.decorator';
import { ReliabilityAverageResponseDto } from '../application/dtos/reliability-average-response.dto';
import { plainToInstance } from 'class-transformer';
import { AlgorithmType } from '@hactto/algorithm';

@ApiTags('- Reliability')
@Controller('reliability')
export class ReliabilityController {
  constructor(private readonly reliabilityService: ReliabilityService) {}

  @ApiOperation({
    summary: 'Analyze the reliability of the algorithm',
  })
  @Admin()
  @ResponseMessage('success.analyze')
  @Post('analyze')
  async analyze(): Promise<void> {
    return await this.reliabilityService.analyze();
  }

  @ApiOperation({
    summary: 'Get the average reliability of the algorithm',
  })
  @ApiOkResponse({ type: ReliabilityAverageResponseDto })
  @ApiQuery({
    name: 'algorithm',
    enum: AlgorithmType,
    required: false,
    description: '알고리즘 타입',
  })
  @Permission()
  @ResponseMessage('success.read')
  @Get('average')
  async getAverage(
    @Query('algorithm', new ParseEnumPipe(AlgorithmType, { optional: true }))
    algorithm?: AlgorithmType,
  ): Promise<ReliabilityAverageResponseDto> {
    const result: ReliabilityAverageResponseDto =
      await this.reliabilityService.getAverageScore(algorithm);
    return plainToInstance(ReliabilityAverageResponseDto, result);
  }
}
