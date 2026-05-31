import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetLatestBestPredictionQuery } from '../queries/get-latest-best-prediction.query';
import { prisma } from '../../../../lib/prisma';
import { AlgorithmType } from '@hactto/algorithm';

@QueryHandler(GetLatestBestPredictionQuery)
export class GetLatestBestPredictionHandler implements IQueryHandler<GetLatestBestPredictionQuery> {
  async execute(): Promise<any | null> {
    // 1. Find the latest episode where prediction reliability is calculated
    const latestPrediction = await prisma.prediction.findFirst({
      where: {
        reliability: { isNot: null },
      },
      orderBy: {
        episode: 'desc',
      },
      select: {
        episode: true,
      },
    });

    if (!latestPrediction) {
      return null;
    }

    const latestEpisode = latestPrediction.episode;

    // 2. Find the prediction with the highest score in that episode
    const bestPrediction = await prisma.prediction.findFirst({
      where: {
        episode: latestEpisode,
        reliability: { isNot: null },
      },
      include: {
        reliability: true,
        winningNumber: true,
      },
      orderBy: {
        reliability: {
          score: 'desc',
        },
      },
    });

    if (
      !bestPrediction ||
      !bestPrediction.reliability ||
      !bestPrediction.winningNumber
    ) {
      return null;
    }

    // 3. Parse numbers and weights
    let predictionNumbers: number[] = [0, 0, 0, 0, 0, 0, 0];
    try {
      const parsed = JSON.parse(bestPrediction.numbers);
      predictionNumbers = [
        parsed['1st'] ?? 0,
        parsed['2nd'] ?? 0,
        parsed['3rd'] ?? 0,
        parsed['4th'] ?? 0,
        parsed['5th'] ?? 0,
        parsed['6th'] ?? 0,
        parsed['bns'] ?? 0,
      ];
    } catch (e) {
      console.error('Failed to parse champion prediction numbers', e);
    }

    let winningNumbers: number[] = [0, 0, 0, 0, 0, 0, 0];
    try {
      const parsed = JSON.parse(bestPrediction.winningNumber.numbers);
      winningNumbers = [
        parsed['1st'] ?? 0,
        parsed['2nd'] ?? 0,
        parsed['3rd'] ?? 0,
        parsed['4th'] ?? 0,
        parsed['5th'] ?? 0,
        parsed['6th'] ?? 0,
        parsed['bns'] ?? 0,
      ];
    } catch (e) {
      console.error('Failed to parse champion winning numbers', e);
    }

    let weights: number[] = [];
    try {
      weights = JSON.parse(bestPrediction.weights);
    } catch (e) {
      console.error('Failed to parse champion weights', e);
    }

    return {
      prediction: {
        id: bestPrediction.id,
        algorithm: bestPrediction.algorithm as AlgorithmType,
        episode: bestPrediction.episode,
        weights,
        numbers: predictionNumbers,
        reliabilityScore: bestPrediction.reliability.score,
      },
      winningNumber: {
        episode: bestPrediction.winningNumber.episode,
        numbers: winningNumbers,
      },
    };
  }
}
