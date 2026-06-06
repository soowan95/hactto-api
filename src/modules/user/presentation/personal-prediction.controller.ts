import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, Headers, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { SavePersonalPredictionRequestDto } from './dtos/requests/save-personal-prediction-request.dto';
import { SavePersonalPredictionCommand } from '../application/commands/save-personal-prediction.command';
import { GetPersonalPredictionHistoryQuery } from '../application/queries/get-personal-prediction-history.query';

@ApiTags('- Personal Prediction')
@Controller('personal-predictions')
export class PersonalPredictionController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @ApiOperation({ summary: '개인 예측 당첨이력 조회' })
  @ResponseMessage('success.read')
  @Get('history')
  async getHistory(@Query('visitorId') visitorId?: string): Promise<any[]> {
    const query = new GetPersonalPredictionHistoryQuery(visitorId);
    return this.queryBus.execute(query);
  }

  @ApiOperation({ summary: '예측번호 저장 (정하기)' })
  @ApiHeader({
    name: 'x-visitor-id',
    required: true,
    description: '방문자 식별자',
  })
  @ResponseMessage('success.create')
  @Post()
  async save(
    @Headers('x-visitor-id') visitorId: string,
    @Body() dto: SavePersonalPredictionRequestDto,
  ): Promise<void> {
    const command = new SavePersonalPredictionCommand(
      visitorId,
      dto.episode,
      dto.prediction,
    );
    await this.commandBus.execute<SavePersonalPredictionCommand, void>(command);
  }
}
