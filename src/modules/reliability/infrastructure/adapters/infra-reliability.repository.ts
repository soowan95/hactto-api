import { Injectable } from '@nestjs/common';
import { IReliabilityRepository } from '../../domain/ports/reliability.repository.interface';
import { prisma } from '../../../../lib/prisma';
import { AlgorithmType } from '@hactto/algorithm';
import { Reliability as EntityReliability } from '../../domain/entities/reliability.entity';
import { Reliability as InfraReliability } from '../../../../generated/prisma/client';
import { InfraReliabilityMapper } from '../mappers/infra-reliability.mapper';

@Injectable()
export class InfraReliabilityRepository implements IReliabilityRepository {
  async createMany(dataList: EntityReliability[]): Promise<void> {
    if (dataList.length > 0) {
      const prismaDataList: InfraReliability[] = dataList.map((reliability) =>
        InfraReliabilityMapper.toPersistence(reliability),
      );
      await prisma.reliability.createMany({
        data: prismaDataList,
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
