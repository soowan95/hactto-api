import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetEpisodeBestPredictionQuery } from '../queries/get-episode-best-prediction.query';
import {
  PREDICTION_REPOSITORY_TOKEN,
  IPredictionRepository,
} from '../../domain/ports/prediction.port';
import { Inject } from '@nestjs/common';
import {
  WINNING_NUMBER_READER_TOKEN,
  WinningNumberReader,
} from '../../domain/ports/winning-number-reader.port';
import {
  BALL_STATUS_READER_TOKEN,
  BallStatusReader,
} from '../../domain/ports/ball-status-reader.port';
import {
  ALGORITHM_REPOSITORY_TOKEN,
  IAlgorithmRepository,
} from '../../domain/ports/algorithm.port';
import { RedisService } from '../../../../helpers/redis/application/redis.service';
import { DomainAlgorithm } from '../../domain/aggregates/algorithm.entity';

@QueryHandler(GetEpisodeBestPredictionQuery)
export class GetEpisodeBestPredictionHandler implements IQueryHandler<GetEpisodeBestPredictionQuery> {
  constructor(
    @Inject(PREDICTION_REPOSITORY_TOKEN)
    private readonly predictionRepository: IPredictionRepository,
    @Inject(WINNING_NUMBER_READER_TOKEN)
    private readonly winningNumberReader: WinningNumberReader,
    @Inject(BALL_STATUS_READER_TOKEN)
    private readonly ballStatusReader: BallStatusReader,
    @Inject(ALGORITHM_REPOSITORY_TOKEN)
    private readonly algorithmRepository: IAlgorithmRepository,
    private readonly redisService: RedisService,
  ) {}
  async execute(query: GetEpisodeBestPredictionQuery) {
    // 1. Find the prediction for the given episode and algorithm with the highest reliability score
    const cacheKey = `algorithm:${query.algorithmType}`;
    const cachedData = await this.redisService.get(cacheKey);
    let algorithm: DomainAlgorithm;
    if (cachedData) {
      algorithm = JSON.parse(cachedData);
    } else {
      algorithm = await this.algorithmRepository.findByType(
        query.algorithmType,
      );
      await this.redisService.set(cacheKey, JSON.stringify(algorithm));
    }
    const bestPrediction =
      await this.predictionRepository.findBestByEpisodeAndAlgorithm(
        query.episode,
        algorithm,
      );

    if (!bestPrediction) {
      return null;
    }

    // 2. Fetch the winning number for the same episode
    const winningNumber = await this.winningNumberReader.findByEpisode(
      query.episode,
    );

    const temperatures = bestPrediction.analysis
      ? await this.ballStatusReader.getBallTemperatures(
          bestPrediction.getNumberArray(),
          bestPrediction.episode,
        )
      : undefined;

    return {
      prediction: {
        id: bestPrediction.id,
        algorithm: bestPrediction.algorithm,
        episode: bestPrediction.episode,
        weights: bestPrediction.getWeights(),
        numbers: bestPrediction.getNumberArray(),
        reliabilityScore: bestPrediction.analysis?.getReliability() ?? 0,
        analysis: bestPrediction.analysis
          ? {
              id: bestPrediction.analysis.id,
              reliability: bestPrediction.analysis.getReliability(),
              sum: bestPrediction.analysis.sum,
              cnt0s: bestPrediction.analysis.cnt0s,
              cnt10s: bestPrediction.analysis.cnt10s,
              cnt20s: bestPrediction.analysis.cnt20s,
              cnt30s: bestPrediction.analysis.cnt30s,
              cnt40s: bestPrediction.analysis.cnt40s,
              sumLastDigits: bestPrediction.analysis.sumLastDigits,
              lastDigit0: JSON.parse(bestPrediction.analysis.lastDigit0),
              lastDigit1: JSON.parse(bestPrediction.analysis.lastDigit1),
              lastDigit2: JSON.parse(bestPrediction.analysis.lastDigit2),
              lastDigit3: JSON.parse(bestPrediction.analysis.lastDigit3),
              lastDigit4: JSON.parse(bestPrediction.analysis.lastDigit4),
              lastDigit5: JSON.parse(bestPrediction.analysis.lastDigit5),
              lastDigit6: JSON.parse(bestPrediction.analysis.lastDigit6),
              lastDigit7: JSON.parse(bestPrediction.analysis.lastDigit7),
              lastDigit8: JSON.parse(bestPrediction.analysis.lastDigit8),
              lastDigit9: JSON.parse(bestPrediction.analysis.lastDigit9),
              even: bestPrediction.analysis.even,
              odd: bestPrediction.analysis.odd,
              hot: bestPrediction.analysis.hot,
              warm: bestPrediction.analysis.warm,
              cold: bestPrediction.analysis.cold,
              low: bestPrediction.analysis.low,
              high: bestPrediction.analysis.high,
              ac: bestPrediction.analysis.ac,
              consecutive: bestPrediction.analysis.consecutive,
              temperatures,
            }
          : null,
      },
      winningNumber: winningNumber
        ? {
            episode: winningNumber.episode,
            numbers: winningNumber.numbers,
            analysis: winningNumber.analysis,
          }
        : null,
    };
  }
}
