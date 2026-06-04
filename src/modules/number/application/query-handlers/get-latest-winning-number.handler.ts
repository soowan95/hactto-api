import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetLatestWinningNumberQuery } from '../queries/get-latest-winning-number.query';
import { Inject } from '@nestjs/common';
import {
  IWinningNumberRepository,
  WINNING_NUMBER_REPOSITORY_TOKEN,
} from '../../domain/ports/winning-number.port';
import { DomainWinningNumber } from '../../domain/aggregates/winning-number.entity';
import { RedisService } from '../../../../helpers/redis/application/redis.service';

@QueryHandler(GetLatestWinningNumberQuery)
export class GetLatestWinningNumberHandler implements IQueryHandler<GetLatestWinningNumberQuery> {
  constructor(
    @Inject(WINNING_NUMBER_REPOSITORY_TOKEN)
    private readonly repository: IWinningNumberRepository,
    private readonly redisService: RedisService,
  ) {}

  async execute(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    query: GetLatestWinningNumberQuery,
  ): Promise<DomainWinningNumber | null> {
    const cacheKey = 'winning-number:latest';

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

    const result = await this.repository.findLatestWithWinningNumber();
    if (result) {
      await this.redisService.set(
        cacheKey,
        JSON.stringify({
          episode: result.episode,
          numbers: result.getNumberArray(),
          isDrawn: result.isDrawn,
          analysis: result.analysis,
        }),
        43200, // 12 hours
      );
    }

    return result;
  }
}
