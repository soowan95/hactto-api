import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUpcomingPredictionCountsQuery } from '../queries/get-upcoming-prediction-counts.query';
import {
  IPredictionRepository,
  PREDICTION_REPOSITORY_TOKEN,
} from '../../domain/ports/prediction.repository.port';
import { Inject } from '@nestjs/common';
import {
  WINNING_NUMBER_READER_TOKEN,
  WinningNumberReader,
} from '../../domain/ports/winning-number-reader.port';
import {
  ALGORITHM_REPOSITORY_TOKEN,
  IAlgorithmRepository,
} from '../../domain/ports/algorithm.repository.port';

@QueryHandler(GetUpcomingPredictionCountsQuery)
export class GetUpcomingPredictionCountsHandler implements IQueryHandler<GetUpcomingPredictionCountsQuery> {
  constructor(
    @Inject(PREDICTION_REPOSITORY_TOKEN)
    private readonly predictionRepository: IPredictionRepository,
    @Inject(WINNING_NUMBER_READER_TOKEN)
    private readonly winningNumberReader: WinningNumberReader,
    @Inject(ALGORITHM_REPOSITORY_TOKEN)
    private readonly algorithmRepository: IAlgorithmRepository,
  ) {}

  async execute(): Promise<{ algorithm: string; count: number }[]> {
    // 1. Find the latest drawn episode
    const latestDrawn =
      await this.winningNumberReader.findLatestWithWinningNumber();

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
