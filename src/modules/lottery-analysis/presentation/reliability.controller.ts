import {
  Controller,
  Get,
  NotFoundException,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Admin } from '../../../common/decorators/admin.decorator';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { ReliabilityAverageResponseDto } from './dtos/responses/reliability-average-response.dto';
import { ReliabilityLeaderboardResponseDto } from './dtos/responses/reliability-leaderboard-response.dto';
import { LatestBestPredictionResponseDto } from './dtos/responses/latest-best-prediction-response.dto';
import { UpcomingPredictionCountsResponseDto } from './dtos/responses/upcoming-prediction-counts-response.dto';
import { AlgorithmReliabilityHistoryResponseDto } from './dtos/responses/algorithm-reliability-history-response.dto';
import { plainToInstance } from 'class-transformer';
import { AnalyzeReliabilityCommand } from '../application/commands/analyze-reliability.command';
import { GetAverageReliabilityQuery } from '../application/queries/get-average-reliability.query';
import { GetAverageReliabilitiesQuery } from '../application/queries/get-average-reliabilities.query';
import { GetLatestBestPredictionQuery } from '../application/queries/get-latest-best-prediction.query';
import { GetUpcomingPredictionCountsQuery } from '../application/queries/get-upcoming-prediction-counts.query';
import { GetAlgorithmReliabilityHistoryQuery } from '../application/queries/get-algorithm-reliability-history.query';
import { GetEpisodeBestPredictionQuery } from '../application/queries/get-episode-best-prediction.query';

import { GuestAllowed } from '../../../common/decorators/guest-allowed.decorator';

@ApiTags('- Reliability')
@Controller('reliability')
export class ReliabilityController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @ApiOperation({
    summary: 'Analyze the reliability of the algorithm',
  })
  @Admin()
  @ResponseMessage('success.analyze')
  @Post('analyze')
  async analyze(): Promise<void> {
    const command = new AnalyzeReliabilityCommand();
    return await this.commandBus.execute(command);
  }

  @ApiOperation({
    summary: 'Get the average reliability of the algorithm',
  })
  @ApiOkResponse({ type: ReliabilityAverageResponseDto })
  @ApiQuery({
    name: 'algorithm',
    required: false,
    description: '알고리즘 타입',
  })
  @GuestAllowed()
  @ResponseMessage('success.read')
  @Get('average')
  async getAverage(
    @Query('algorithm')
    algorithm?: string,
  ): Promise<ReliabilityAverageResponseDto> {
    const query = new GetAverageReliabilityQuery(algorithm);
    const result: number = await this.queryBus.execute(query);
    return plainToInstance(ReliabilityAverageResponseDto, {
      type: algorithm,
      average: result,
    });
  }

  @ApiOperation({
    summary: 'Get the average reliability leaderboard of all algorithms',
  })
  @ApiOkResponse({ type: [ReliabilityLeaderboardResponseDto] })
  @GuestAllowed()
  @ResponseMessage('success.read')
  @Get('averages')
  async getAverages(): Promise<ReliabilityLeaderboardResponseDto[]> {
    const query = new GetAverageReliabilitiesQuery();
    const results: any[] = await this.queryBus.execute(query);
    return plainToInstance(ReliabilityLeaderboardResponseDto, results);
  }

  @ApiOperation({
    summary:
      'Get the highest reliability prediction from the latest drawn round',
  })
  @ApiOkResponse({ type: LatestBestPredictionResponseDto })
  @GuestAllowed()
  @ResponseMessage('success.read')
  @Get('latest-best')
  async getLatestBest(): Promise<LatestBestPredictionResponseDto | null> {
    const query = new GetLatestBestPredictionQuery();
    const result = await this.queryBus.execute(query);
    return plainToInstance(LatestBestPredictionResponseDto, result);
  }

  @ApiOperation({
    summary:
      'Get counts of generated predictions for the upcoming episode by algorithm',
  })
  @ApiOkResponse({ type: [UpcomingPredictionCountsResponseDto] })
  @GuestAllowed()
  @ResponseMessage('success.read')
  @Get('upcoming-counts')
  async getUpcomingCounts(): Promise<UpcomingPredictionCountsResponseDto[]> {
    const query = new GetUpcomingPredictionCountsQuery();
    const results: any[] = await this.queryBus.execute(query);
    return plainToInstance(UpcomingPredictionCountsResponseDto, results);
  }

  @ApiOperation({
    summary: 'Get the historical average reliability scores of an algorithm',
  })
  @ApiOkResponse({ type: [AlgorithmReliabilityHistoryResponseDto] })
  @ApiQuery({
    name: 'algorithm',
    required: true,
    description: '알고리즘 타입',
  })
  @GuestAllowed()
  @ResponseMessage('success.read')
  @Get('history')
  async getHistory(
    @Query('algorithm')
    algorithm: string,
  ): Promise<AlgorithmReliabilityHistoryResponseDto[]> {
    const query = new GetAlgorithmReliabilityHistoryQuery(algorithm);
    const results: any[] = await this.queryBus.execute(query);
    return plainToInstance(AlgorithmReliabilityHistoryResponseDto, results);
  }

  @ApiOperation({
    summary: 'Get the best prediction for a specific episode and algorithm',
  })
  @GuestAllowed()
  @ResponseMessage('success.read')
  @Get('best')
  async getBest(
    @Query('episode', ParseIntPipe) episode: number,
    @Query('algorithm')
    algorithm: string,
  ): Promise<any> {
    const query = new GetEpisodeBestPredictionQuery(episode, algorithm);
    const result = await this.queryBus.execute(query);
    if (!result) {
      throw new NotFoundException(
        '해당 회차 및 알고리즘의 분석 데이터가 존재하지 않습니다.',
      );
    }
    return result;
  }
}
