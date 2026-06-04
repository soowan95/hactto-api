import { IAnalysisRepository } from '../../domain/ports/analysis.port';
import { Injectable } from '@nestjs/common';
import { prisma } from '../../../../lib/prisma';
import { DomainAnalysis } from '../../domain/aggregates/analysis.entity';
import { InfraAnalysisMapper } from '../mappers/infra-analysis.mapper';

@Injectable()
export class InfraAnalysisRepository implements IAnalysisRepository {
  async insert(analysis: DomainAnalysis): Promise<DomainAnalysis> {
    const data = await prisma.analysis.create({
      data: InfraAnalysisMapper.toPersistence(analysis),
    });
    return InfraAnalysisMapper.toEntity(data);
  }

  async update(analysis: DomainAnalysis): Promise<void> {
    await prisma.analysis.update({
      where: {
        id: analysis.id as number,
      },
      data: {
        reliability: analysis.reliability.getScore(),
      },
    });
  }

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
