import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { SetPersonalWeightRequestDto } from './dtos/requests/set-personal-weight-request.dto';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { SetPersonalWeightCommand } from '../application/commands/set-personal-weight.command';
import { GetPersonalWeightQuery } from '../application/queries/get-personal-weight.query';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('- Personal Weight')
@Controller('personal-weights')
export class PersonalWeightController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @ApiOperation({ summary: '개인화 가중치 저장' })
  @UseGuards(JwtAuthGuard)
  @ResponseMessage('success.create')
  @Post()
  async setWeights(
    @Req() req: any,
    @Body() dto: SetPersonalWeightRequestDto,
  ): Promise<void> {
    const userId = req.user?.sub || req.user?.id;
    const command = new SetPersonalWeightCommand(
      userId,
      dto.algorithm,
      dto.weights,
    );
    await this.commandBus.execute<SetPersonalWeightCommand>(command);
  }

  @ApiOperation({ summary: '개인화 가중치 조회' })
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'algorithm', required: true })
  @ResponseMessage('success.read')
  @Get()
  async getWeights(
    @Req() req: any,
    @Query('algorithm')
    algorithm: string,
  ): Promise<number[]> {
    const userId = req.user?.sub || req.user?.id;
    const query = new GetPersonalWeightQuery(userId, algorithm);
    const result = await this.queryBus.execute<
      GetPersonalWeightQuery,
      number[]
    >(query);
    if (!result) return [25, 20, 18, 15, 12, 10];
    return result;
  }
}
