import { Injectable } from '@nestjs/common';
import { IAlgorithmResultRepository } from '../../domain/ports/algorithm-result.repository.interface';
import { prisma } from '../../../../lib/prisma';
import { AlgorithmResult } from '../../../../generated/prisma/client';
import { DomainAlgorithmResult } from '../../domain/entities/algorithm-result.entity';
import { InfraAlgorithmResultMapper } from '../mappers/infra-algorithm-result.mapper';

@Injectable()
export class InfraAlgorithmResultRepository implements IAlgorithmResultRepository {
  async create(
    algorithmResult: DomainAlgorithmResult,
  ): Promise<DomainAlgorithmResult> {
    const result: AlgorithmResult = await prisma.algorithmResult.create({
      data: InfraAlgorithmResultMapper.toPersistence(algorithmResult),
    });
    return InfraAlgorithmResultMapper.toEntity(result);
  }

  async findWithoutReliability(): Promise<DomainAlgorithmResult[]> {
    const results: AlgorithmResult[] = await prisma.algorithmResult.findMany({
      where: {
        reliability: null,
      },
    });

    return results.map((algorithmResult) =>
      InfraAlgorithmResultMapper.toEntity(algorithmResult),
    );
  }

  async findByUser(visitorId?: string): Promise<DomainAlgorithmResult[]> {
    if (!visitorId) return [];

    const results = await prisma.algorithmResult.findMany({
      where: {
        visitorId,
      },
      orderBy: {
        id: 'desc',
      },
    });

    return results.map((algorithmResult) =>
      InfraAlgorithmResultMapper.toEntity(algorithmResult),
    );
  }

  async count(): Promise<number> {
    return prisma.algorithmResult.count();
  }

  async updatePersonalWeight(
    id: number,
    personalWeightId: number,
  ): Promise<void> {
    await prisma.algorithmResult.update({
      where: {
        id,
      },
      data: {
        personalWeightId,
      },
    });
  }
}
