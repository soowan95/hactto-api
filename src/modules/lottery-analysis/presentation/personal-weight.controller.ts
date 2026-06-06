import { Body, Controller, Get, Headers, Post, Query } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { SetPersonalWeightRequestDto } from './dtos/requests/set-personal-weight-request.dto';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { SetPersonalWeightCommand } from '../application/commands/set-personal-weight.command';
import { GetPersonalWeightQuery } from '../application/queries/get-personal-weight.query';

@ApiTags('- Personal Weight')
@Controller('personal-weights')
export class PersonalWeightController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @ApiOperation({ summary: '개인화 가중치 저장' })
  @ApiHeader({
    name: 'x-visitor-id',
    required: true,
    description: '방문자 식별자',
  })
  @ResponseMessage('success.create')
  @Post()
  async setWeights(
    @Headers('x-visitor-id') visitorId: string,
    @Body() dto: SetPersonalWeightRequestDto,
  ): Promise<void> {
    const command = new SetPersonalWeightCommand(
      visitorId,
      dto.algorithm,
      dto.weights,
    );
    await this.commandBus.execute<SetPersonalWeightCommand>(command);
  }

  @ApiOperation({ summary: '개인화 가중치 조회' })
  @ApiHeader({
    name: 'x-visitor-id',
    required: true,
    description: '방문자 식별자',
  })
  @ApiQuery({ name: 'algorithm', required: true })
  @ResponseMessage('success.read')
  @Get()
  async getWeights(
    @Headers('x-visitor-id') visitorId: string,
    @Query('algorithm')
    algorithm: string,
  ): Promise<number[]> {
    const query = new GetPersonalWeightQuery(visitorId, algorithm);
    const result = await this.queryBus.execute<
      GetPersonalWeightQuery,
      number[]
    >(query);
    if (!result) return [25, 20, 18, 15, 12, 10];
    return result;
  }
}
