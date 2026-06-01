import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetEpisodeBestPredictionQuery } from '../queries/get-episode-best-prediction.query';
import {
  PREDICTION_REPOSITORY_TOKEN,
  IPredictionRepository,
} from '../../domain/ports/prediction.repository.interface';
import { Inject } from '@nestjs/common';
import {
  IWinningNumberRepository,
  WINNING_NUMBER_REPOSITORY_TOKEN,
} from '../../../winning-number/domain/ports/winning-number.repository.interface';
import {
  ALGORITHM_REPOSITORY_TOKEN,
  IAlgorithmRepository,
} from '../../domain/ports/algorithm.repository.interface';
import { RedisService } from '../../../../helpers/redis/application/redis.service';
import { DomainAlgorithm } from '../../domain/aggregates/algorithm.entity';

@QueryHandler(GetEpisodeBestPredictionQuery)
export class GetEpisodeBestPredictionHandler implements IQueryHandler<GetEpisodeBestPredictionQuery> {
  constructor(
    @Inject(PREDICTION_REPOSITORY_TOKEN)
    private readonly predictionRepository: IPredictionRepository,
    @Inject(WINNING_NUMBER_REPOSITORY_TOKEN)
    private readonly winningNumberRepository: IWinningNumberRepository,
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
    const winningNumber = await this.winningNumberRepository.findByEpisode(
      query.episode,
    );

    return {
      prediction: {
        id: bestPrediction.id,
        algorithm: bestPrediction.algorithm,
        episode: bestPrediction.episode,
        weights: bestPrediction.getWeights(),
        numbers: bestPrediction.getNumberArray(),
        reliabilityScore: bestPrediction.reliability?.score || 0,
      },
      winningNumber: winningNumber
        ? {
            episode: winningNumber.episode,
            numbers: winningNumber.getNumberArray(),
          }
        : null,
    };
  }
}
