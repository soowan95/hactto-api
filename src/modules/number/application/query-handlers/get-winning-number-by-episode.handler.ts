import { IQueryHandler, QueryHandler, QueryBus } from '@nestjs/cqrs';
import { GetWinningNumberByEpisodeQuery } from '../queries/get-winning-number-by-episode.query';
import { Inject } from '@nestjs/common';
import {
  IWinningNumberRepository,
  WINNING_NUMBER_REPOSITORY_TOKEN,
} from '../../domain/ports/winning-number.port';
import { DomainWinningNumber } from '../../domain/aggregates/winning-number.entity';
import { RedisService } from '../../../../helpers/redis/application/redis.service';
import { GetLotteryBallStatusQuery } from '../queries/get-lottery-ball-status.query';

@QueryHandler(GetWinningNumberByEpisodeQuery)
export class GetWinningNumberByEpisodeHandler implements IQueryHandler<GetWinningNumberByEpisodeQuery> {
  constructor(
    @Inject(WINNING_NUMBER_REPOSITORY_TOKEN)
    private readonly repository: IWinningNumberRepository,
    private readonly redisService: RedisService,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(
    query: GetWinningNumberByEpisodeQuery,
  ): Promise<DomainWinningNumber> {
    const cacheKey = `winning-number:episode:${query.episode}`;

    const cachedData = await this.redisService.get(cacheKey);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      const entity = new DomainWinningNumber(
        parsed.episode,
        parsed.numbers,
        parsed.isDrawn,
      );
      if (parsed.analysis) {
        entity.analysis = parsed.analysis;
      }
      return entity;
    }

    const result = await this.repository.findByEpisode(query.episode);
    if (result) {
      if (result.analysis) {
        const temperatures = await this.getBallTemperatures(
          result.getNumberArray().slice(0, 6),
          result.episode,
        );
        result.analysis.temperatures = temperatures;
      }

      await this.redisService.set(
        cacheKey,
        JSON.stringify({
          episode: result.episode,
          numbers: result.getNumberArray(),
          isDrawn: result.isDrawn,
          analysis: result.analysis,
        }),
        604800, // 7 days
      );
    }

    return result;
  }

  private async getBallTemperatures(
    balls: number[],
    episode: number,
  ): Promise<Record<number, string>> {
    const temperatures: Record<number, string> = {};
    await Promise.all(
      balls.map(async (ball) => {
        const result = await this.queryBus.execute(
          new GetLotteryBallStatusQuery(ball, episode),
        );
        temperatures[ball] = result.status;
      }),
    );
    return temperatures;
  }
}
