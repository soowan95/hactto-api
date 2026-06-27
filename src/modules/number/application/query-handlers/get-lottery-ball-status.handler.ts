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
} from '../../domain/vos/ball.temperature.vo';
import { prisma } from '../../../../libs/prisma';

@QueryHandler(GetLotteryBallStatusQuery)
export class GetLotteryBallStatusHandler implements IQueryHandler<GetLotteryBallStatusQuery> {
  private cachedRawNumbers: any[] | null = null;
  private cacheTimestamp = 0;
  private readonly CACHE_TTL_MS = 60000; // 1 minute

  constructor(
    @Inject(WINNING_NUMBER_REPOSITORY_TOKEN)
    private readonly repository: IWinningNumberRepository,
    private readonly redisService: RedisService,
  ) {}

  private async getRawWinningNumbers(): Promise<any[]> {
    const now = Date.now();
    if (
      this.cachedRawNumbers &&
      now - this.cacheTimestamp < this.CACHE_TTL_MS
    ) {
      return this.cachedRawNumbers;
    }

    const raw = await prisma.winningNumber.findMany({
      where: { isDrawn: true },
      select: {
        episode: true,
        lt1WnNo: true,
        lt2WnNo: true,
        lt3WnNo: true,
        lt4WnNo: true,
        lt5WnNo: true,
        lt6WnNo: true,
      },
      orderBy: {
        episode: 'desc',
      },
    });

    this.cachedRawNumbers = raw;
    this.cacheTimestamp = now;
    return raw;
  }

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

    let rawList = await this.getRawWinningNumbers();
    if (query.beforeEpisode !== undefined) {
      rawList = rawList.filter((wn) => wn.episode < query.beforeEpisode!);
    }

    if (rawList.length === 0) {
      return new LotteryBallStatus(0, 0, BallTemperature.COLD, 0, [], 0);
    }

    let recentTen = 0;
    let recentThirty = 0;
    let latestEpisode = 0;

    const coOccurrenceMap = new Map<number, number>();

    for (let i = 0; i < rawList.length; i++) {
      const currentWinning = rawList[i];
      const numbers = [
        currentWinning.lt1WnNo,
        currentWinning.lt2WnNo,
        currentWinning.lt3WnNo,
        currentWinning.lt4WnNo,
        currentWinning.lt5WnNo,
        currentWinning.lt6WnNo,
      ];
      const hasBall = numbers.includes(query.ball);

      if (hasBall) {
        if (latestEpisode === 0) latestEpisode = currentWinning.episode;
        if (i < 10) {
          recentTen++;
          recentThirty++;
        } else if (i < 30) recentThirty++;

        numbers.forEach((num) => {
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

    const skip = rawList[0].episode - latestEpisode;

    const result = new LotteryBallStatus(
      recentTen,
      recentThirty,
      getBallTemperature(skip),
      skip,
      friendlyNumbers,
      latestEpisode,
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
