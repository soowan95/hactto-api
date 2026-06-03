import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAllWinningNumbersQuery } from '../queries/get-all-winning-numbers.query';
import { Inject } from '@nestjs/common';
import {
  IWinningNumberRepository,
  WINNING_NUMBER_REPOSITORY_TOKEN,
} from '../../domain/ports/winning-number.repository.port';
import { DomainWinningNumber } from '../../domain/entities/winning-number.entity';
import { RedisService } from '../../../../helpers/redis/application/redis.service';

@QueryHandler(GetAllWinningNumbersQuery)
export class GetAllWinningNumbersHandler implements IQueryHandler<GetAllWinningNumbersQuery> {
  constructor(
    @Inject(WINNING_NUMBER_REPOSITORY_TOKEN)
    private readonly repository: IWinningNumberRepository,
    private readonly redisService: RedisService,
  ) {}

  async execute(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    query: GetAllWinningNumbersQuery,
  ): Promise<DomainWinningNumber[]> {
    const cacheKey = 'winning-number:all';

    const cachedData = await this.redisService.get(cacheKey);
    if (cachedData) {
      const parsedList = JSON.parse(cachedData);
      return parsedList.map(
        (item: any) =>
          new DomainWinningNumber(item.episode, item.numbers, item.isDrawn),
      );
    }

    const result = await this.repository.findAll();
    const serialized = result.map((wn) => ({
      episode: wn.episode,
      numbers: wn.getNumberArray(),
      isDrawn: wn.isDrawn,
    }));
    await this.redisService.set(cacheKey, JSON.stringify(serialized), 86400); // 24 hours

    return result;
  }
}
