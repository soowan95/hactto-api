import { ApiOperation, ApiTags, ApiHeader } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Post,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { AnalyzePersonalPredictionRequestDto } from './dtos/requests/analyze-personal-prediction-request.dto';
import { AnalyzePersonalPredictionCommand } from '../application/commands/analyze-personal-prediction.command';
import { CommandBus } from '@nestjs/cqrs';
import { DomainPersonalAnalysis } from '../domain/aggregates/personal-analysis.entity';
import { plainToClass } from 'class-transformer';
import { AnalyzePersonalPredictionResponseDto } from './dtos/responses/analyze-personal-prediction-response.dto';
import { HonService } from '../application/hon.service';

@ApiTags('- Personal Analysis')
@Controller('personal-analysis')
export class PersonalAnalysisController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly honService: HonService,
  ) {}

  @ApiOperation({ summary: 'Analyze personal prediction' })
  @ApiHeader({
    name: 'x-visitor-id',
    required: true,
    description: '방문자 식별자',
  })
  @ResponseMessage('success.alanyze')
  @Post()
  async analyze(
    @Body() dto: AnalyzePersonalPredictionRequestDto,
    @Headers('x-visitor-id') visitorId?: string,
  ): Promise<AnalyzePersonalPredictionResponseDto> {
    if (!visitorId) {
      throw new BadRequestException('Visitor ID가 필요합니다.');
    }

    await this.honService.deductHon(visitorId, 5, '로또 번호 분석');

    const command = new AnalyzePersonalPredictionCommand(dto.prediction);
    const personalAnalysis = await this.commandBus.execute<
      AnalyzePersonalPredictionCommand,
      DomainPersonalAnalysis
    >(command);
    return plainToClass(AnalyzePersonalPredictionResponseDto, personalAnalysis);
  }
}
