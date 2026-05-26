import { Injectable } from '@nestjs/common';
import { IAlgorithmResultRepository } from '../../domain/ports/algorithm-result.repository.interface';
import { prisma } from '../../../../lib/prisma';
import { AlgorithmResult as InfraAlgorithmResult } from '../../../../generated/prisma/client';
import { AlgorithmResult as EntityAlgorithmResult } from '../../domain/entities/algorithm-result.entity';
import { InfraAlgorithmResultMapper } from '../mappers/infra-algorithm-result.mapper';

@Injectable()
export class InfraAlgorithmResultRepository implements IAlgorithmResultRepository {
  async create(
    algorithmResult: EntityAlgorithmResult,
  ): Promise<EntityAlgorithmResult> {
    const result: InfraAlgorithmResult = await prisma.algorithmResult.create({
      data: InfraAlgorithmResultMapper.toPersistence(algorithmResult),
    });
    return InfraAlgorithmResultMapper.toEntity(result);
  }

  async findWithoutReliability(): Promise<EntityAlgorithmResult[]> {
    const results: InfraAlgorithmResult[] =
      await prisma.algorithmResult.findMany({
        where: {
          reliability: null,
        },
      });

    return results.map((algorithmResult) =>
      InfraAlgorithmResultMapper.toEntity(algorithmResult),
    );
  }

  async findByUser(
    ip?: string,
    visitorId?: string,
  ): Promise<EntityAlgorithmResult[]> {
    if (!ip && !visitorId) return [];

    const conditions: any[] = [];
    if (ip) conditions.push({ ip });
    if (visitorId) conditions.push({ visitorId });

    const results = await prisma.algorithmResult.findMany({
      where: {
        OR: conditions,
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
}
