import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetWinningNumberByEpisodeQuery } from '../queries/get-winning-number-by-episode.query';
import { Inject } from '@nestjs/common';
import {
  IWinningNumberRepository,
  WINNING_NUMBER_REPOSITORY_TOKEN,
} from '../../domain/ports/winning-number.repository.interface';
import { DomainWinningNumber } from '../../domain/entities/winning-number.entity';
import { RedisService } from '../../../../helpers/redis/application/redis.service';

@QueryHandler(GetWinningNumberByEpisodeQuery)
export class GetWinningNumberByEpisodeHandler implements IQueryHandler<GetWinningNumberByEpisodeQuery> {
  constructor(
    @Inject(WINNING_NUMBER_REPOSITORY_TOKEN)
    private readonly repository: IWinningNumberRepository,
    private readonly redisService: RedisService,
  ) {}

  async execute(
    query: GetWinningNumberByEpisodeQuery,
  ): Promise<DomainWinningNumber> {
    const cacheKey = `winning-number:episode:${query.episode}`;

    const cachedData = await this.redisService.get(cacheKey);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      return new DomainWinningNumber(
        parsed.episode,
        parsed.numbers,
        parsed.isDrawn,
      );
    }

    const result = await this.repository.findByEpisode(query.episode);
    if (result) {
      await this.redisService.set(
        cacheKey,
        JSON.stringify({
          episode: result.episode,
          numbers: result.getNumberArray(),
          isDrawn: result.isDrawn,
        }),
        604800, // 7 days
      );
    }

    return result;
  }
}
