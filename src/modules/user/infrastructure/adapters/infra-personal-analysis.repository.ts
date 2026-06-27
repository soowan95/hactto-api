import { Injectable } from '@nestjs/common';
import { IPersonalAnalysisRepository } from '../../domain/ports/personal-analysis.port';
import { DomainPersonalAnalysis } from '../../domain/aggregates/personal-analysis.entity';
import { prisma } from '../../../../libs/prisma';
import { InfraPersonalAnalysisMapper } from '../mappers/infra-personal-analysis.mapper';

@Injectable()
export class InfraPersonalAnalysisRepository implements IPersonalAnalysisRepository {
  async findById(id: number): Promise<DomainPersonalAnalysis | null> {
    const raw = await prisma.personalAnalysis.findUnique({
      where: { id },
    });
    if (!raw) return null;
    return InfraPersonalAnalysisMapper.toEntity(raw);
  }

  async upsert(analysis: DomainPersonalAnalysis): Promise<void> {
    const data = InfraPersonalAnalysisMapper.toPersistence(analysis);
    await prisma.personalAnalysis.upsert({
      where: { id: analysis.id },
      update: data,
      create: data,
    });
  }
}
