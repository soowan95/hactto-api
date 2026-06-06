import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AlgorithmResponsesDto } from './dtos/responses/algorithm-responses.dto';
import { plainToInstance } from 'class-transformer';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { GeneratePredictionResponseDto } from './dtos/responses/generate-prediction-response.dto';
import { AlgorithmHistoryResponseDto } from './dtos/responses/algorithm-history-response.dto';
import { GeneratePredictionCommand } from '../application/commands/generate-prediction.command';
import { GetPredictionHistoryQuery } from '../application/queries/get-prediction-history.query';
import { GeneratePredictionRequestDto } from './dtos/requests/generate-prediction-request.dto';

import { GetAlgorithmTypeQuery } from '../application/queries/get-algorithm-type.query';
import { RedisManager } from '../../../common/decorators/redis-manager.decorator';
import { FetchAlgorithmCommand } from '../application/commands/fetch-algorithm.command';
import { UpdateAlgorithmRequestDto } from './dtos/requests/update-algorithm-request.dto';
import { UpdateAlgorithmCommand } from '../application/commands/update-algorithm.command';

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
  @ResponseMessage('success.read')
  @Get()
  async getAllAlgorithmTypes(): Promise<AlgorithmResponsesDto> {
    const query = new GetAlgorithmTypeQuery();
    const result = await this.queryBus.execute(query);
    return plainToInstance(AlgorithmResponsesDto, result);
  }

  @ApiOperation({
    summary: 'Get prediction history for a user',
  })
  @ApiHeader({
    name: 'x-visitor-id',
    required: false,
    description: '방문자 식별자',
  })
  @ResponseMessage('success.read')
  @Get('history')
  async getHistory(
    @Headers('x-visitor-id') visitorId?: string,
  ): Promise<AlgorithmHistoryResponseDto[]> {
    const query = new GetPredictionHistoryQuery(visitorId);
    const results: any[] = await this.queryBus.execute(query);
    return plainToInstance(AlgorithmHistoryResponseDto, results);
  }

  @ApiOperation({
    summary: 'Get specific algorithm type',
  })
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
  @ResponseMessage('success.save')
  @Put(':type')
  async updateAlgorithm(
    @Param('type') type: string,
    @Body() dto: UpdateAlgorithmRequestDto,
  ): Promise<AlgorithmResponsesDto> {
    const command = new UpdateAlgorithmCommand(
      type,
      dto.complexity,
      dto.name,
      dto.description,
    );
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
  @ApiHeader({
    name: 'x-visitor-id',
    required: false,
    description: '방문자 식별자',
  })
  @ResponseMessage('success.generate')
  @Post(':type/generate')
  async generatePrediction(
    @Param('type') type: string,
    @Body() dto: GeneratePredictionRequestDto,
    @Headers('x-visitor-id') visitorId?: string,
  ): Promise<GeneratePredictionResponseDto> {
    const command = new GeneratePredictionCommand(
      type,
      visitorId,
      dto.weights,
      dto.oddCount,
    );
    const generated = await this.commandBus.execute(command);
    return plainToInstance(GeneratePredictionResponseDto, {
      numbers: generated.getNumberArray(),
      analysis: generated.analysis
        ? {
            id: generated.analysis.id,
            reliability: generated.analysis.getReliability(),
            sum: generated.analysis.sum,
            cnt0s: generated.analysis.cnt0s,
            cnt10s: generated.analysis.cnt10s,
            cnt20s: generated.analysis.cnt20s,
            cnt30s: generated.analysis.cnt30s,
            cnt40s: generated.analysis.cnt40s,
            sumLastDigits: generated.analysis.sumLastDigits,
            lastDigit0: JSON.parse(generated.analysis.lastDigit0),
            lastDigit1: JSON.parse(generated.analysis.lastDigit1),
            lastDigit2: JSON.parse(generated.analysis.lastDigit2),
            lastDigit3: JSON.parse(generated.analysis.lastDigit3),
            lastDigit4: JSON.parse(generated.analysis.lastDigit4),
            lastDigit5: JSON.parse(generated.analysis.lastDigit5),
            lastDigit6: JSON.parse(generated.analysis.lastDigit6),
            lastDigit7: JSON.parse(generated.analysis.lastDigit7),
            lastDigit8: JSON.parse(generated.analysis.lastDigit8),
            lastDigit9: JSON.parse(generated.analysis.lastDigit9),
            even: generated.analysis.even,
            odd: generated.analysis.odd,
            hot: generated.analysis.hot,
            warm: generated.analysis.warm,
            cold: generated.analysis.cold,
            low: generated.analysis.low,
            high: generated.analysis.high,
            ac: generated.analysis.ac,
            consecutive: generated.analysis.consecutive,
            temperatures: generated.analysis.temperatures,
          }
        : undefined,
    });
  }
}
