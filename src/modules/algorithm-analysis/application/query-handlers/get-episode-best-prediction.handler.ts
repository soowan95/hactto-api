import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetEpisodeBestPredictionQuery } from '../queries/get-episode-best-prediction.query';
import {
  ALGORITHM_ANALYSIS_REPOSITORY_TOKEN,
  IAlgorithmAnalysisRepository,
} from '../../domain/ports/algorithm-analysis.repository.interface';
import { Inject } from '@nestjs/common';
import {
  IWinningNumberRepository,
  WINNING_NUMBER_REPOSITORY_TOKEN,
} from '../../../winning-number/domain/ports/winning-number.repository.interface';

@QueryHandler(GetEpisodeBestPredictionQuery)
export class GetEpisodeBestPredictionHandler implements IQueryHandler<GetEpisodeBestPredictionQuery> {
  constructor(
    @Inject(ALGORITHM_ANALYSIS_REPOSITORY_TOKEN)
    private readonly algorithmRepository: IAlgorithmAnalysisRepository,
    @Inject(WINNING_NUMBER_REPOSITORY_TOKEN)
    private readonly winningNumberRepository: IWinningNumberRepository,
  ) {}
  async execute(query: GetEpisodeBestPredictionQuery) {
    // 1. Find the prediction for the given episode and algorithm with the highest reliability score
    const bestPrediction =
      await this.algorithmRepository.findBestByEpisodeAndAlgorithm(
        query.episode,
        query.algorithm,
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
