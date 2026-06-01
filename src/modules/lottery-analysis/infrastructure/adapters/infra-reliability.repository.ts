import { IReliabilityRepository } from '../../domain/ports/reliability.repository.interface';
import { Injectable } from '@nestjs/common';
import { prisma } from '../../../../lib/prisma';

@Injectable()
export class InfraReliabilityRepository implements IReliabilityRepository {
  async getAverageScore(algorithm?: string): Promise<number> {
    const whereClause: any = {};
    if (algorithm) {
      whereClause.prediction = {
        is: {
          algorithmType: algorithm,
        },
      };
    }

    const averageScore = await prisma.reliability.aggregate({
      _avg: { score: true },
      where: whereClause,
    });
    return averageScore._avg.score || 0;
  }
}
