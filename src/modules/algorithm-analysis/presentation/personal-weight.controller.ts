import {
  Body,
  Controller,
  Get,
  ParseEnumPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AlgorithmType } from '@hactto/algorithm';
import { SetPersonalWeightRequestDto } from './dtos/requests/set-personal-weight-request.dto';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { Permission } from '../../../common/decorators/permission.decorator';
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
  @Permission()
  @ResponseMessage('success.create')
  @Post()
  async setWeights(@Body() dto: SetPersonalWeightRequestDto): Promise<void> {
    const command = new SetPersonalWeightCommand(
      dto.visitorId,
      dto.algorithm,
      dto.weights,
    );
    await this.commandBus.execute<SetPersonalWeightCommand>(command);
  }

  @ApiOperation({ summary: '개인화 가중치 조회' })
  @ApiQuery({ name: 'visitorId', type: String, required: true })
  @ApiQuery({ name: 'algorithm', enum: AlgorithmType, required: true })
  @Permission()
  @ResponseMessage('success.read')
  @Get()
  async getWeights(
    @Query('visitorId') visitorId: string,
    @Query('algorithm', new ParseEnumPipe(AlgorithmType))
    algorithm: AlgorithmType,
  ): Promise<number[]> {
    const query = new GetPersonalWeightQuery(visitorId, algorithm);
    const result = await this.queryBus.execute<
      GetPersonalWeightQuery,
      number[]
    >(query);
    if (!result) return [25, 20, 15, 15, 10, 10, 5];
    return result;
  }
}
