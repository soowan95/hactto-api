import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Post } from '@nestjs/common';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { AnalyzePersonalPredictionRequestDto } from './dtos/requests/analyze-personal-prediction-request.dto';
import { AnalyzePersonalPredictionCommand } from '../application/commands/analyze-personal-prediction.command';
import { CommandBus } from '@nestjs/cqrs';
import { DomainPersonalAnalysis } from '../domain/aggregates/personal-analysis.entity';
import { plainToClass } from 'class-transformer';
import { AnalyzePersonalPredictionResponseDto } from './dtos/responses/analyze-personal-prediction-response.dto';

@ApiTags('- Personal Analysis')
@Controller('personal-analysis')
export class PersonalAnalysisController {
  constructor(private readonly commandBus: CommandBus) {}

  @ApiOperation({ summary: 'Analyze personal prediction' })
  @ResponseMessage('success.alanyze')
  @Post()
  async analyze(
    @Body() dto: AnalyzePersonalPredictionRequestDto,
  ): Promise<AnalyzePersonalPredictionResponseDto> {
    const command = new AnalyzePersonalPredictionCommand(dto.prediction);
    const personalAnalysis = await this.commandBus.execute<
      AnalyzePersonalPredictionCommand,
      DomainPersonalAnalysis
    >(command);
    return plainToClass(AnalyzePersonalPredictionResponseDto, personalAnalysis);
  }
}
