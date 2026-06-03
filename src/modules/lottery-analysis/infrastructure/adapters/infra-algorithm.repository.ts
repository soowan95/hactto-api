import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '../../../../lib/prisma';
import { InfraAlgorithmMapper } from '../mappers/infra-algorithm.mapper';
import { DomainAlgorithm } from '../../domain/aggregates/algorithm.entity';
import { IAlgorithmRepository } from '../../domain/ports/algorithm.repository.port';

@Injectable()
export class InfraAlgorithmRepository implements IAlgorithmRepository {
  async findAll(): Promise<DomainAlgorithm[]> {
    const result = await prisma.algorithm.findMany();

    return result.map((at) => InfraAlgorithmMapper.toEntity(at));
  }

  async findByType(type: string): Promise<DomainAlgorithm> {
    const result = await prisma.algorithm.findUnique({ where: { type } });

    if (!result) throw new NotFoundException(`Algorithm with type ${type}`);

    return InfraAlgorithmMapper.toEntity(result);
  }

  async upsert(algorithm: DomainAlgorithm): Promise<void> {
    const data = InfraAlgorithmMapper.toPersistence(algorithm);
    await prisma.algorithm.upsert({
      where: { type: algorithm.type },
      update: {
        complexity: data.complexity,
      },
      create: {
        type: data.type,
        complexity: data.complexity,
      },
    });
  }

  async update(algorithm: DomainAlgorithm): Promise<DomainAlgorithm> {
    const data = InfraAlgorithmMapper.toPersistence(algorithm);
    const result = await prisma.algorithm.update({
      where: { type: algorithm.type },
      data: {
        complexity: data.complexity,
      },
    });
    return InfraAlgorithmMapper.toEntity(result);
  }
}
