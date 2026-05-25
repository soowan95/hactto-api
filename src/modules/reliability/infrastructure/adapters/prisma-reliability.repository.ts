import { Injectable } from '@nestjs/common';
import { IReliabilityRepository } from '../../domain/ports/reliability.repository.interface';
import { prisma } from '../../../../lib/prisma';
import { AlgorithmType } from '@hactto/algorithm';

@Injectable()
export class PrismaReliabilityRepository implements IReliabilityRepository {
  async createMany(dataList: { id: number; score: number }[]): Promise<void> {
    if (dataList.length > 0) {
      await prisma.reliability.createMany({
        data: dataList,
        skipDuplicates: true,
      });
    }
  }

  async getAverageScore(algorithm?: AlgorithmType): Promise<number> {
    const averageScore = await prisma.reliability.aggregate({
      _avg: { score: true },
      where: { algorithmResult: { algorithm: algorithm } },
    });
    return averageScore._avg.score || 0;
  }
}
