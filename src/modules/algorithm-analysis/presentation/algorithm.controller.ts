import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AllAlgorithmTypesResponsesDto } from './dtos/responses/all-algorithm-types-responses.dto';
import { plainToInstance } from 'class-transformer';
import { Permission } from '../../../common/decorators/permission.decorator';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { GenerateWinningNumberResponseDto } from './dtos/responses/generate-winning-number-response.dto';
import { AlgorithmType, getAlgorithm } from '@hactto/algorithm';
import { AlgorithmHistoryResponseDto } from './dtos/responses/algorithm-history-response.dto';
import { GeneratePredictionCommand } from '../application/commands/generate-prediction/generate-prediction.command';
import { GetPredictionHistoryQuery } from '../application/queries/get-prediction-history/get-prediction-history.query';
import { GeneratePredictionRequestDto } from './dtos/requests/generate-prediction-request.dto';

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
  @Permission()
  @ResponseMessage('success.read')
  @Get()
  async getAllAlgorithmTypes(): Promise<AllAlgorithmTypesResponsesDto> {
    const allAlgorithmTypes: string[] = getAlgorithm();
    return plainToInstance(AllAlgorithmTypesResponsesDto, {
      types: allAlgorithmTypes,
    });
  }

  @ApiOperation({
    summary: 'Generate winning number',
  })
  @ApiParam({
    name: 'type',
    enum: AlgorithmType,
    description: '알고리즘 타입',
  })
  @Permission()
  @ResponseMessage('success.generate')
  @Post(':type/generate')
  async generatePrediction(
    @Param('type', new ParseEnumPipe(AlgorithmType)) type: AlgorithmType,
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
