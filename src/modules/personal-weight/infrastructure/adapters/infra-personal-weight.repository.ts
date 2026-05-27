import { Injectable } from '@nestjs/common';
import { IPersonalWeightRepository } from '../../domain/ports/personal-weight.repository.interface';
import { DomainPersonalWeight } from '../../domain/entities/personal-weight.entity';
import { AlgorithmType } from '@hactto/algorithm';
import { prisma } from '../../../../lib/prisma';
import { InfraPersonalWeightMapper } from '../mappers/infra-personal-weight.mapper';

@Injectable()
export class InfraPersonalWeightRepository implements IPersonalWeightRepository {
  async findByUserAndAlgorithm(
    visitorId: string,
    algorithm: AlgorithmType,
  ): Promise<DomainPersonalWeight | null> {
    const raw = await prisma.personalWeight.findFirst({
      where: {
        visitorId,
        algorithm,
      },
      orderBy: {
        id: 'desc',
      },
    });
    if (!raw) return null;
    return InfraPersonalWeightMapper.toEntity(raw);
  }

  async create(
    personalWeight: DomainPersonalWeight,
  ): Promise<DomainPersonalWeight> {
    const rawData = InfraPersonalWeightMapper.toPersistence(personalWeight);
    const result = await prisma.personalWeight.create({
      data: {
        visitorId: rawData.visitorId,
        algorithm: rawData.algorithm,
        weights: rawData.weights,
      },
    });
    return InfraPersonalWeightMapper.toEntity(result);
  }

  async findById(id: number): Promise<DomainPersonalWeight | null> {
    const raw = await prisma.personalWeight.findUnique({
      where: {
        id,
      },
    });
    if (!raw) return null;
    return InfraPersonalWeightMapper.toEntity(raw);
  }
}
