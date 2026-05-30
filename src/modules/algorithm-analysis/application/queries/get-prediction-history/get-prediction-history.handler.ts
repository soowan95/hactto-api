import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetPredictionHistoryQuery } from './get-prediction-history.query';
import { Inject } from '@nestjs/common';
import {
  ALGORITHM_ANALYSIS_REPOSITORY_TOKEN,
  IAlgorithmAnalysisRepository,
} from '../../../domain/ports/algorithm-analysis.repository.interface';
import {
  WINNING_NUMBER_REPOSITORY_TOKEN,
  IWinningNumberRepository,
} from '../../../../winning-number/domain/ports/winning-number.repository.interface';
import { DomainWinningNumber } from '../../../../winning-number/domain/entities/winning-number.entity';
import { RedisService } from '../../../../../helpers/redis/redis.service';

@QueryHandler(GetPredictionHistoryQuery)
export class GetPredictionHistoryHandler implements IQueryHandler<GetPredictionHistoryQuery> {
  constructor(
    @Inject(ALGORITHM_ANALYSIS_REPOSITORY_TOKEN)
    private readonly repository: IAlgorithmAnalysisRepository,
    @Inject(WINNING_NUMBER_REPOSITORY_TOKEN)
    private readonly winningNumberRepository: IWinningNumberRepository,
    private readonly redisService: RedisService,
  ) {}

  async execute(query: GetPredictionHistoryQuery): Promise<any[]> {
    if (!query.visitorId || query.visitorId === 'guest') {
      return [];
    }

    const cacheKey = `user:${query.visitorId}:predictions:history`;

    const cachedData = await this.redisService.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const results = await this.repository.findByUser(query.visitorId);
    if (results.length === 0) return [];

    const episodes = Array.from(new Set(results.map((r) => r.episode)));
    const winningNumbers = await this.winningNumberRepository.findAll({
      where: {
        episode: { in: episodes },
      },
    });

    const winningNumbersMap = new Map<number, DomainWinningNumber>();
    for (const wn of winningNumbers) {
      winningNumbersMap.set(wn.episode, wn);
    }

    const history = results.map((result) => {
      const winningNumber = winningNumbersMap.get(result.episode);
      const predictedNumbers = result.getNumberArray();

      let matchResult: any = null;
      if (winningNumber && winningNumber.isDrawn) {
        const winningNumbersArr = winningNumber.getNumberArray();

        const predictedMain = predictedNumbers.slice(0, 6);
        const winningMain = winningNumbersArr.slice(0, 6);
        const winningBonus = winningNumbersArr[6];

        const matchedNumbers = predictedMain.filter((n) =>
          winningMain.includes(n),
        );
        const matchCount = matchedNumbers.length;
        const bonusMatch = predictedNumbers[6] === winningBonus;

        let rank = 0; // 0 means no prize
        if (matchCount === 6) rank = 1;
        else if (matchCount === 5 && bonusMatch) rank = 2;
        else if (matchCount === 5) rank = 3;
        else if (matchCount === 4) rank = 4;
        else if (matchCount === 3) rank = 5;

        matchResult = {
          winningNumbers: winningNumbersArr,
          matchedNumbers,
          matchCount,
          bonusMatch,
          rank,
        };
      }

      return {
        id: result.id,
        algorithm: result.algorithm,
        episode: result.episode,
        numbers: predictedNumbers,
        matchResult,
      };
    });

    await this.redisService.set(cacheKey, JSON.stringify(history), 3600); // 1 hour

    return history;
  }
}
