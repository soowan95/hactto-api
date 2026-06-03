import { IAnalysisRepository } from '../../domain/ports/analysis.repository.port';
import { Injectable } from '@nestjs/common';
import { prisma } from '../../../../lib/prisma';

@Injectable()
export class InfraAnalysisRepository implements IAnalysisRepository {
  async getAverageScore(algorithm?: string): Promise<number> {
    const whereClause: any = {};
    if (algorithm) {
      whereClause.prediction = {
        is: {
          algorithmType: algorithm,
        },
      };
    }

    const averageScore = await prisma.analysis.aggregate({
      _avg: { reliability: true },
      where: whereClause,
    });
    return averageScore._avg.reliability || 0;
  }
}
