import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetPredictionHistoryQuery } from '../queries/get-prediction-history.query';
import { Inject } from '@nestjs/common';
import {
  PREDICTION_REPOSITORY_TOKEN,
  IPredictionRepository,
} from '../../domain/ports/prediction.port';
import {
  WINNING_NUMBER_READER_TOKEN,
  WinningNumberReader,
} from '../../domain/ports/winning-number-reader.port';
import {
  BALL_STATUS_READER_TOKEN,
  BallStatusReader,
} from '../../domain/ports/ball-status-reader.port';
import { AnalysisWinningNumber } from '../../domain/aggregates/winning-number.entity';
import { RedisService } from '../../../../helpers/redis/application/redis.service';

@QueryHandler(GetPredictionHistoryQuery)
export class GetPredictionHistoryHandler implements IQueryHandler<GetPredictionHistoryQuery> {
  constructor(
    @Inject(PREDICTION_REPOSITORY_TOKEN)
    private readonly repository: IPredictionRepository,
    @Inject(WINNING_NUMBER_READER_TOKEN)
    private readonly winningNumberReader: WinningNumberReader,
    @Inject(BALL_STATUS_READER_TOKEN)
    private readonly ballStatusReader: BallStatusReader,
    private readonly redisService: RedisService,
  ) {}

  async execute(query: GetPredictionHistoryQuery): Promise<any[]> {
    if (!query.visitorId) {
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
    const winningNumbers = await this.winningNumberReader.findAll({
      episodeIn: episodes,
    });

    const winningNumbersMap = new Map<number, AnalysisWinningNumber>();
    for (const wn of winningNumbers) {
      winningNumbersMap.set(wn.episode, wn);
    }

    const history = await Promise.all(
      results.map(async (result) => {
        const winningNumber = winningNumbersMap.get(result.episode);
        const predictedNumbers = result.getNumberArray();

        let matchResult: any = null;
        if (winningNumber && winningNumber.isDrawn) {
          const winningNumbersArr = winningNumber.numbers;

          const predictedMain = predictedNumbers.slice(0, 6);
          const winningMain = winningNumbersArr.slice(0, 6);
          const winningBonus = winningNumbersArr[6];

          const matchedNumbers = predictedMain.filter((n) =>
            winningMain.includes(n),
          );
          const matchCount = matchedNumbers.length;
          const bonusMatch = predictedMain.includes(winningBonus);

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

        const temperatures = await this.ballStatusReader.getBallTemperatures(
          predictedNumbers,
          result.episode,
        );

        return {
          id: result.id,
          algorithm: result.algorithm,
          episode: result.episode,
          numbers: predictedNumbers,
          matchResult,
          analysis: result.analysis
            ? {
                id: result.analysis.id,
                reliability: result.analysis.getReliability(),
                sum: result.analysis.sum,
                cnt0s: result.analysis.cnt0s,
                cnt10s: result.analysis.cnt10s,
                cnt20s: result.analysis.cnt20s,
                cnt30s: result.analysis.cnt30s,
                cnt40s: result.analysis.cnt40s,
                sumLastDigits: result.analysis.sumLastDigits,
                lastDigit0: JSON.parse(result.analysis.lastDigit0),
                lastDigit1: JSON.parse(result.analysis.lastDigit1),
                lastDigit2: JSON.parse(result.analysis.lastDigit2),
                lastDigit3: JSON.parse(result.analysis.lastDigit3),
                lastDigit4: JSON.parse(result.analysis.lastDigit4),
                lastDigit5: JSON.parse(result.analysis.lastDigit5),
                lastDigit6: JSON.parse(result.analysis.lastDigit6),
                lastDigit7: JSON.parse(result.analysis.lastDigit7),
                lastDigit8: JSON.parse(result.analysis.lastDigit8),
                lastDigit9: JSON.parse(result.analysis.lastDigit9),
                even: result.analysis.even,
                odd: result.analysis.odd,
                hot: result.analysis.hot,
                warm: result.analysis.warm,
                cold: result.analysis.cold,
                low: result.analysis.low,
                high: result.analysis.high,
                ac: result.analysis.ac,
                consecutive: result.analysis.consecutive,
                temperatures,
              }
            : null,
        };
      }),
    );

    await this.redisService.set(cacheKey, JSON.stringify(history), 3600); // 1 hour

    return history;
  }
}
