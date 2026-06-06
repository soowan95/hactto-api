import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetPersonalPredictionHistoryQuery } from '../queries/get-personal-prediction-history.query';
import {
  PERSONAL_PREDICTION_REPOSITORY_TOKEN,
  IPersonalPredictionRepository,
} from '../../domain/ports/personal-prediction.port';
import {
  WINNING_NUMBER_REPOSITORY_TOKEN,
  IWinningNumberRepository,
} from '../../../number/domain/ports/winning-number.port';
import {
  USER_BALL_STATUS_READER_TOKEN,
  UserBallStatusReader,
} from '../../domain/ports/ball-status-reader.port';
import { RedisService } from '../../../../helpers/redis/application/redis.service';

@QueryHandler(GetPersonalPredictionHistoryQuery)
export class GetPersonalPredictionHistoryHandler implements IQueryHandler<GetPersonalPredictionHistoryQuery> {
  constructor(
    @Inject(PERSONAL_PREDICTION_REPOSITORY_TOKEN)
    private readonly repository: IPersonalPredictionRepository,
    @Inject(WINNING_NUMBER_REPOSITORY_TOKEN)
    private readonly winningNumberRepository: IWinningNumberRepository,
    @Inject(USER_BALL_STATUS_READER_TOKEN)
    private readonly ballStatusReader: UserBallStatusReader,
    private readonly redisService: RedisService,
  ) {}

  async execute(query: GetPersonalPredictionHistoryQuery): Promise<any[]> {
    if (!query.visitorId) {
      return [];
    }

    const cacheKey = `user:${query.visitorId}:personal-predictions:history`;

    const cachedData = await this.redisService.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const results = await this.repository.findByUser(query.visitorId);
    if (results.length === 0) return [];

    const episodes = Array.from(
      new Set(results.map((r) => r.prediction.episode)),
    );
    const winningNumbers = await this.winningNumberRepository.findAll({
      where: {
        episode: {
          in: episodes,
        },
      },
    });

    const winningNumbersMap = new Map<number, any>();
    for (const wn of winningNumbers) {
      winningNumbersMap.set(wn.episode, wn);
    }

    const history = await Promise.all(
      results.map(async ({ prediction, analysis }) => {
        const winningNumber = winningNumbersMap.get(prediction.episode);
        const predictedNumbers = prediction.numbers;

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

        const temperatures =
          await this.ballStatusReader.getBallTemperatures(predictedNumbers);

        return {
          id: prediction.id,
          episode: prediction.episode,
          numbers: predictedNumbers,
          matchResult,
          analysis: analysis
            ? {
                id: analysis.id,
                sum: analysis.sum,
                cnt0s: analysis.cnt0s,
                cnt10s: analysis.cnt10s,
                cnt20s: analysis.cnt20s,
                cnt30s: analysis.cnt30s,
                cnt40s: analysis.cnt40s,
                sumLastDigits: analysis.sumLastDigits,
                lastDigit0: JSON.parse(analysis.lastDigit0),
                lastDigit1: JSON.parse(analysis.lastDigit1),
                lastDigit2: JSON.parse(analysis.lastDigit2),
                lastDigit3: JSON.parse(analysis.lastDigit3),
                lastDigit4: JSON.parse(analysis.lastDigit4),
                lastDigit5: JSON.parse(analysis.lastDigit5),
                lastDigit6: JSON.parse(analysis.lastDigit6),
                lastDigit7: JSON.parse(analysis.lastDigit7),
                lastDigit8: JSON.parse(analysis.lastDigit8),
                lastDigit9: JSON.parse(analysis.lastDigit9),
                even: analysis.even,
                odd: analysis.odd,
                hot: analysis.hot,
                warm: analysis.warm,
                cold: analysis.cold,
                low: analysis.low,
                high: analysis.high,
                ac: analysis.ac,
                consecutive: analysis.consecutive,
                pair: analysis.pair,
                prime: analysis.prime,
                composite: analysis.composite,
                mul3: analysis.mul3,
                win1: analysis.win1,
                win2: analysis.win2,
                win3: analysis.win3,
                win4: analysis.win4,
                win5: analysis.win5,
                temperatures,
              }
            : null,
        };
      }),
    );

    await this.redisService.set(cacheKey, JSON.stringify(history), 60); // 1 minute (personal predictions can be saved more dynamically)

    return history;
  }
}
