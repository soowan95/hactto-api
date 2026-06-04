import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetLotteryBallStatusQuery } from '../queries/get-lottery-ball-status.query';
import {
  IWinningNumberRepository,
  WINNING_NUMBER_REPOSITORY_TOKEN,
} from '../../domain/ports/winning-number.port';
import { Inject } from '@nestjs/common';
import { RedisService } from '../../../../helpers/redis/application/redis.service';
import { LotteryBallStatus } from '../../domain/aggregates/lottery-ball-status.entity';
import {
  getBallTemperature,
  BallTemperature,
} from '../../domain/vos/BallTemperature';

@QueryHandler(GetLotteryBallStatusQuery)
export class GetLotteryBallStatusHandler implements IQueryHandler<GetLotteryBallStatusQuery> {
  constructor(
    @Inject(WINNING_NUMBER_REPOSITORY_TOKEN)
    private readonly repository: IWinningNumberRepository,
    private readonly redisService: RedisService,
  ) {}

  async execute(query: GetLotteryBallStatusQuery): Promise<LotteryBallStatus> {
    const cacheKey = `lottery-ball:status:${query.ball}:${query.beforeEpisode ?? 'latest'}`;

    const cachedData = await this.redisService.get(cacheKey);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      return new LotteryBallStatus(
        parsed.recentTen,
        parsed.recentThirty,
        parsed.status,
        parsed.skip,
        parsed.friendlyNumbers,
        parsed.latestEpisode,
      );
    }

    const whereClause: any = {
      isDrawn: true,
    };
    if (query.beforeEpisode !== undefined) {
      whereClause.episode = {
        lt: query.beforeEpisode,
      };
    }

    const winningNumbers = await this.repository.findAll({
      where: whereClause,
      orderBy: {
        episode: 'desc',
      },
    });

    if (winningNumbers.length === 0) {
      return new LotteryBallStatus(0, 0, BallTemperature.COLD, 0, [], 0);
    }

    let recentTen = 0;
    let recentThirty = 0;
    let lastestEpisode = 0;

    const coOccurrenceMap = new Map<number, number>();

    for (let i = 0; i < winningNumbers.length; i++) {
      const currentWinning = winningNumbers[i];
      const hasBall = currentWinning.isContain(query.ball);

      if (hasBall) {
        if (lastestEpisode === 0) lastestEpisode = currentWinning.episode;
        if (i < 10) {
          recentTen++;
          recentThirty++;
        } else if (i < 30) recentThirty++;

        const allNumbers: number[] = currentWinning.getNumberArray() || [];

        allNumbers.forEach((num) => {
          if (num !== query.ball) {
            coOccurrenceMap.set(num, (coOccurrenceMap.get(num) || 0) + 1);
          }
        });
      }
    }

    const friendlyNumbers = Array.from(coOccurrenceMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([num]) => num);

    const skip = winningNumbers[0].episode - lastestEpisode;

    const result = new LotteryBallStatus(
      recentTen,
      recentThirty,
      getBallTemperature(skip),
      skip,
      friendlyNumbers,
      lastestEpisode,
    );
    await this.redisService.set(
      cacheKey,
      JSON.stringify({
        recentTen: result.recentTen,
        recentThirty: result.recentThirty,
        status: result.status,
        skip: skip,
        friendlyNumbers: result.getFriendlyNumberArray(),
        latestEpisode: result.latestEpisode,
      }),
      604800, // 7 days
    );

    return result;
  }
}
