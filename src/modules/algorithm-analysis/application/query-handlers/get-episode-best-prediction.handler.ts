import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetEpisodeBestPredictionQuery } from '../queries/get-episode-best-prediction.query';
import { prisma } from '../../../../lib/prisma';

@QueryHandler(GetEpisodeBestPredictionQuery)
export class GetEpisodeBestPredictionHandler implements IQueryHandler<GetEpisodeBestPredictionQuery> {
  async execute(query: GetEpisodeBestPredictionQuery) {
    // 1. Find the prediction for the given episode and algorithm with the highest reliability score
    const bestPrediction = await prisma.prediction.findFirst({
      where: {
        episode: query.episode,
        algorithm: query.algorithm,
        reliability: { isNot: null },
      },
      include: {
        reliability: true,
      },
      orderBy: {
        reliability: {
          score: 'desc',
        },
      },
    });

    if (!bestPrediction) {
      return null;
    }

    // 2. Fetch winning number for the same episode
    const winningNumber = await prisma.winningNumber.findUnique({
      where: {
        episode: query.episode,
      },
    });

    // 3. Parse numbers and weights into arrays
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
      console.error('Failed to parse prediction numbers', e);
    }

    let winningNumbers: number[] = [0, 0, 0, 0, 0, 0, 0];
    if (winningNumber) {
      try {
        const parsed = JSON.parse(winningNumber.numbers);
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
        console.error('Failed to parse winning numbers', e);
      }
    }

    let weights: number[] = [];
    try {
      weights = JSON.parse(bestPrediction.weights);
    } catch (e) {
      console.error('Failed to parse weights', e);
    }

    return {
      prediction: {
        id: bestPrediction.id,
        algorithm: bestPrediction.algorithm,
        episode: bestPrediction.episode,
        weights,
        numbers: predictionNumbers,
        reliabilityScore: bestPrediction.reliability?.score || 0,
      },
      winningNumber: winningNumber
        ? {
            episode: winningNumber.episode,
            numbers: winningNumbers,
          }
        : null,
    };
  }
}
