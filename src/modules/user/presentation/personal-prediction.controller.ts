import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
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
  @UseGuards(JwtAuthGuard)
  @ResponseMessage('success.read')
  @Get('history')
  async getHistory(@Req() req: any): Promise<any[]> {
    const userId = req.user?.sub || req.user?.id;
    const query = new GetPersonalPredictionHistoryQuery(userId);
    return this.queryBus.execute(query);
  }

  @ApiOperation({ summary: '예측번호 저장 (정하기)' })
  @UseGuards(JwtAuthGuard)
  @ResponseMessage('success.create')
  @Post()
  async save(
    @Req() req: any,
    @Body() dto: SavePersonalPredictionRequestDto,
  ): Promise<void> {
    const userId = req.user?.sub || req.user?.id;
    const command = new SavePersonalPredictionCommand(
      userId,
      dto.episode,
      dto.prediction,
    );
    await this.commandBus.execute<SavePersonalPredictionCommand, void>(command);
  }
}
