import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUpcomingPredictionCountsQuery } from '../queries/get-upcoming-prediction-counts.query';
import {
  IPredictionRepository,
  PREDICTION_REPOSITORY_TOKEN,
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

@QueryHandler(GetUpcomingPredictionCountsQuery)
export class GetUpcomingPredictionCountsHandler implements IQueryHandler<GetUpcomingPredictionCountsQuery> {
  constructor(
    @Inject(PREDICTION_REPOSITORY_TOKEN)
    private readonly predictionRepository: IPredictionRepository,
    @Inject(WINNING_NUMBER_REPOSITORY_TOKEN)
    private readonly winningNumberRepository: IWinningNumberRepository,
    @Inject(ALGORITHM_REPOSITORY_TOKEN)
    private readonly algorithmRepository: IAlgorithmRepository,
  ) {}

  async execute(): Promise<{ algorithm: string; count: number }[]> {
    // 1. Find the latest drawn episode
    const latestDrawn =
      await this.winningNumberRepository.findLatestWithWinningNumber();

    const upcomingEpisode = latestDrawn ? latestDrawn.episode + 1 : 1;

    // 2. Count predictions generated for this upcoming episode grouped by algorithm
    const counts =
      await this.predictionRepository.groupByAlgorithmTypeHavingEpisode(
        upcomingEpisode,
      );

    // 3. Make sure all algorithm types are present in the response
    const algorithms = await this.algorithmRepository.findAll();
    const allTypes = algorithms.map((ag) => ag.type);
    return allTypes.map((type) => {
      const group = counts.find((c) => c.algorithmType === type);
      return {
        algorithm: type,
        count: group ? group._count.id : 0,
      };
    });
  }
}
