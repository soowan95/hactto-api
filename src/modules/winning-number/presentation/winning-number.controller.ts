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
import { WinningNumberResponseConvertor } from '../domain/services/winning-number-response-convertor';

import { FetchWinningNumbersCommand } from '../application/commands/fetch-winning-numbers.command';
import { GetAllWinningNumbersQuery } from '../application/queries/get-all-winning-numbers.query';
import { GetLatestWinningNumberQuery } from '../application/queries/get-latest-winning-number.query';
import { GetWinningNumberByEpisodeQuery } from '../application/queries/get-winning-number-by-episode.query';

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
    return plainToInstance(
      WinningNumberShowResponseDto,
      winningNumbers.map((winningNumber) =>
        WinningNumberResponseConvertor.convertForShow(winningNumber),
      ),
    );
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
    else
      return plainToInstance(
        WinningNumberShowResponseDto,
        WinningNumberResponseConvertor.convertForShow(winningNumber),
      );
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
    return plainToInstance(
      WinningNumberShowResponseDto,
      WinningNumberResponseConvertor.convertForShow(winningNumber),
    );
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
