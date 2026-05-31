import { Controller, Get, ParseEnumPipe, Post, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Admin } from '../../../common/decorators/admin.decorator';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { ReliabilityAverageResponseDto } from './dtos/responses/reliability-average-response.dto';
import { plainToInstance } from 'class-transformer';
import { AlgorithmType } from '@hactto/algorithm';
import { AnalyzeReliabilityCommand } from '../application/commands/analyze-reliability.command';
import { GetAverageReliabilityQuery } from '../application/queries/get-average-reliability.query';

import { GuestAllowed } from '../../../common/decorators/guest-allowed.decorator';

@ApiTags('- Reliability')
@Controller('reliability')
export class ReliabilityController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @ApiOperation({
    summary: 'Analyze the reliability of the algorithm',
  })
  @Admin()
  @ResponseMessage('success.analyze')
  @Post('analyze')
  async analyze(): Promise<void> {
    const command = new AnalyzeReliabilityCommand();
    return await this.commandBus.execute(command);
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
  @GuestAllowed()
  @ResponseMessage('success.read')
  @Get('average')
  async getAverage(
    @Query('algorithm', new ParseEnumPipe(AlgorithmType, { optional: true }))
    algorithm?: AlgorithmType,
  ): Promise<ReliabilityAverageResponseDto> {
    const query = new GetAverageReliabilityQuery(algorithm);
    const result: number = await this.queryBus.execute(query);
    return plainToInstance(ReliabilityAverageResponseDto, {
      type: algorithm,
      average: result,
    });
  }
}
