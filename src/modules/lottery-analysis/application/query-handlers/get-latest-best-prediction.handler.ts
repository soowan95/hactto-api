import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetLatestBestPredictionQuery } from '../queries/get-latest-best-prediction.query';
import { Inject } from '@nestjs/common';
import {
  PREDICTION_REPOSITORY_TOKEN,
  IPredictionRepository,
} from '../../domain/ports/prediction.repository.interface';
import {
  IWinningNumberRepository,
  WINNING_NUMBER_REPOSITORY_TOKEN,
} from '../../../winning-number/domain/ports/winning-number.repository.interface';

@QueryHandler(GetLatestBestPredictionQuery)
export class GetLatestBestPredictionHandler implements IQueryHandler<GetLatestBestPredictionQuery> {
  constructor(
    @Inject(PREDICTION_REPOSITORY_TOKEN)
    private readonly algorithmRepository: IPredictionRepository,
    @Inject(WINNING_NUMBER_REPOSITORY_TOKEN)
    private readonly winningNumberRepository: IWinningNumberRepository,
  ) {}
  async execute(): Promise<any | null> {
    // 1. Find the latest episode where prediction reliability is calculated
    const latestPrediction =
      await this.algorithmRepository.findRecentEpisodeByReliabilityIsNotNull();

    if (!latestPrediction) {
      return null;
    }

    const latestEpisode = latestPrediction.episode;

    // 2. Find the prediction with the highest score in that episode
    const bestPrediction =
      await this.algorithmRepository.findBestByEpisodeAndReliabilityIsNotNull(
        latestEpisode,
      );

    if (
      !bestPrediction ||
      !bestPrediction.reliability ||
      !bestPrediction.isNonZero()
    ) {
      return null;
    }

    const winningNumber =
      await this.winningNumberRepository.findByEpisode(latestEpisode);

    return {
      prediction: {
        id: bestPrediction.id,
        algorithm: bestPrediction.algorithm,
        episode: bestPrediction.episode,
        weights: bestPrediction.getWeights(),
        numbers: bestPrediction.getNumberArray(),
        reliabilityScore: bestPrediction.reliability.getScore(),
      },
      winningNumber: {
        episode: latestEpisode,
        numbers: winningNumber.getNumberArray(),
      },
    };
  }
}
