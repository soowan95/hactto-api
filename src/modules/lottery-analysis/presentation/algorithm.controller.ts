import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AlgorithmResponsesDto } from './dtos/responses/algorithm-responses.dto';
import { plainToInstance } from 'class-transformer';
import { Permission } from '../../../common/decorators/permission.decorator';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { GenerateWinningNumberResponseDto } from './dtos/responses/generate-winning-number-response.dto';
import { AlgorithmHistoryResponseDto } from './dtos/responses/algorithm-history-response.dto';
import { GeneratePredictionCommand } from '../application/commands/generate-prediction.command';
import { GetPredictionHistoryQuery } from '../application/queries/get-prediction-history.query';
import { GeneratePredictionRequestDto } from './dtos/requests/generate-prediction-request.dto';

import { GuestAllowed } from '../../../common/decorators/guest-allowed.decorator';
import { GetAlgorithmTypeQuery } from '../application/queries/get-algorithm-type.query';
import { RedisManager } from '../../../common/decorators/redis-manager.decorator';
import { FetchAlgorithmCommand } from '../application/commands/fetch-algorithm.command';
import { SetAlgorithmComplexityRequest } from './dtos/requests/set-algorithm-complexity-request.dto';
import { SetAlgorithmComplexityCommand } from '../application/commands/set-algorithm-complexity.command';

@ApiTags('- Algorithm')
@Controller('algorithms')
export class AlgorithmController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @ApiOperation({
    summary: 'Get all algorithm types',
  })
  @GuestAllowed()
  @ResponseMessage('success.read')
  @Get()
  async getAllAlgorithmTypes(): Promise<AlgorithmResponsesDto> {
    const query = new GetAlgorithmTypeQuery();
    const result = await this.queryBus.execute(query);
    return plainToInstance(AlgorithmResponsesDto, result);
  }

  @ApiOperation({
    summary: 'Get specific algorithm type',
  })
  @GuestAllowed()
  @ResponseMessage('success.read')
  @Get(':type')
  async getAlgorithmType(
    @Param('type') type: string,
  ): Promise<AlgorithmResponsesDto> {
    const query = new GetAlgorithmTypeQuery(type);
    const result = await this.queryBus.execute(query);
    return plainToInstance(AlgorithmResponsesDto, result);
  }

  @ApiOperation({
    summary: 'Set algorithm',
  })
  @GuestAllowed()
  @ResponseMessage('success.save')
  @Put(':type')
  async setAlgorithmComplexity(
    @Param('type') type: string,
    @Body() dto: SetAlgorithmComplexityRequest,
  ): Promise<AlgorithmResponsesDto> {
    const command = new SetAlgorithmComplexityCommand(type, dto.complexity);
    const result = await this.commandBus.execute(command);
    return plainToInstance(AlgorithmResponsesDto, result);
  }

  @ApiOperation({
    summary: 'Save algorithm',
  })
  @RedisManager()
  @ResponseMessage('success.save')
  @Post('/fetch')
  async fetchAlgorithm(): Promise<void> {
    const command = new FetchAlgorithmCommand();
    await this.commandBus.execute(command);
  }

  @ApiOperation({
    summary: 'Generate winning number',
  })
  @ApiParam({
    name: 'type',
    description: '알고리즘 타입',
  })
  @Permission()
  @ResponseMessage('success.generate')
  @Post(':type/generate')
  async generatePrediction(
    @Param('type') type: string,
    @Body() dto: GeneratePredictionRequestDto,
    @Query('visitorId') visitorId?: string,
  ): Promise<GenerateWinningNumberResponseDto> {
    const command = new GeneratePredictionCommand(type, visitorId, dto.weights);
    const generated = await this.commandBus.execute(command);
    return plainToInstance(GenerateWinningNumberResponseDto, {
      numbers: generated.getNumberArray(),
    });
  }

  @ApiOperation({
    summary: 'Get prediction history for a user',
  })
  @Permission()
  @ResponseMessage('success.read')
  @Get('history')
  async getHistory(
    @Query('visitorId') visitorId?: string,
  ): Promise<AlgorithmHistoryResponseDto[]> {
    const query = new GetPredictionHistoryQuery(visitorId);
    const results: any[] = await this.queryBus.execute(query);
    return plainToInstance(AlgorithmHistoryResponseDto, results);
  }
}
