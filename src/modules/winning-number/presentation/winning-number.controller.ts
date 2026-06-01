import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { WinningNumberShowResponseDto } from './dtos/responses/winning-number-show-response.dto';
import { Admin } from '../../../common/decorators/admin.decorator';
import { DomainWinningNumber } from '../domain/entities/winning-number.entity';
import { plainToInstance } from 'class-transformer';

import { FetchWinningNumbersCommand } from '../application/commands/fetch-winning-numbers.command';
import { GetAllWinningNumbersQuery } from '../application/queries/get-all-winning-numbers.query';
import { GetLatestWinningNumberQuery } from '../application/queries/get-latest-winning-number.query';
import { GetWinningNumberByEpisodeQuery } from '../application/queries/get-winning-number-by-episode.query';
import { GetLotteryBallStatusQuery } from '../application/queries/get-lottery-ball-status.query';
import { LotteryBallStatus } from '../domain/entities/lottery-ball-status.entity';
import { LotteryBallStatusShowResponseDto } from './dtos/responses/lottery-ball-status-show-response.dto';

@ApiTags('- Winning Number')
@Controller('winning-numbers')
export class WinningNumberController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @ApiOperation({
    summary: 'Get all winning numbers',
  })
  @ResponseMessage('success.read')
  @Get()
  async findAll(): Promise<WinningNumberShowResponseDto[]> {
    const query = new GetAllWinningNumbersQuery();
    const winningNumbers = await this.queryBus.execute<
      GetAllWinningNumbersQuery,
      DomainWinningNumber[]
    >(query);
    return plainToInstance(WinningNumberShowResponseDto, winningNumbers);
  }

  @ApiOperation({
    summary: 'Get the latest winning number',
  })
  @ResponseMessage('success.read')
  @Get('latest')
  async findLatest(): Promise<WinningNumberShowResponseDto | null> {
    const query = new GetLatestWinningNumberQuery();
    const winningNumber = await this.queryBus.execute<
      GetLatestWinningNumberQuery,
      DomainWinningNumber | null
    >(query);
    if (!winningNumber) return null;
    else return plainToInstance(WinningNumberShowResponseDto, winningNumber);
  }

  @ApiOperation({
    summary: 'Get the winning number by episode',
  })
  @ApiParam({ name: 'episode', required: true, description: '회차 번호' })
  @ResponseMessage('success.read')
  @Get(':episode')
  async findByEpisode(
    @Param('episode', ParseIntPipe) episode: number,
  ): Promise<WinningNumberShowResponseDto> {
    const query = new GetWinningNumberByEpisodeQuery(episode);
    const winningNumber = await this.queryBus.execute<
      GetWinningNumberByEpisodeQuery,
      DomainWinningNumber
    >(query);
    return plainToInstance(WinningNumberShowResponseDto, winningNumber);
  }

  @ApiOperation({
    summary: 'Get the status of a lottery ball',
  })
  @ApiParam({ name: 'ball', required: true, description: '공 번호' })
  @ResponseMessage('success.read')
  @Get('lottery-ball/:ball')
  async getLotteryBallStatus(
    @Param('ball', ParseIntPipe) ball: number,
  ): Promise<LotteryBallStatusShowResponseDto> {
    const query = new GetLotteryBallStatusQuery(ball);

    const result = await this.queryBus.execute<
      GetLotteryBallStatusQuery,
      LotteryBallStatus
    >(query);

    return plainToInstance(LotteryBallStatusShowResponseDto, result);
  }

  @ApiOperation({
    summary: 'Fetch all winning numbers from 동행복권',
  })
  @ApiQuery({
    name: 'latestEpisode',
    required: true,
    description: '최근 회차 번호',
  })
  @Admin()
  @ResponseMessage('success.fetch.all')
  @Post('fetch')
  async fetch(
    @Query('latestEpisode', ParseIntPipe) latestEpisode: number,
  ): Promise<void> {
    const command = new FetchWinningNumbersCommand(latestEpisode);
    await this.commandBus.execute(command);
  }
}
