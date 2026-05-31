import { Injectable } from '@nestjs/common';
import { IAlgorithmAnalysisRepository } from '../../domain/ports/algorithm-analysis.repository.interface';
import { prisma } from '../../../../lib/prisma';
import { DomainPrediction } from '../../domain/aggregates/prediction.entity';
import { InfraAlgorithmAnalysisMapper } from '../mappers/infra-algorithm-analysis.mapper';
import { AlgorithmType } from '@hactto/algorithm';

@Injectable()
export class InfraAlgorithmAnalysisRepository implements IAlgorithmAnalysisRepository {
  async create(analysis: DomainPrediction): Promise<DomainPrediction> {
    const raw = InfraAlgorithmAnalysisMapper.toPersistence(analysis);

    const data: any = {
      algorithm: raw.algorithm,
      episode: raw.episode,
      weights: raw.weights,
      numbers: raw.numbers,
      visitorId: raw.visitorId,
    };

    const result = await prisma.prediction.create({
      data,
    });

    return InfraAlgorithmAnalysisMapper.toEntity(result);
  }

  async save(analysis: DomainPrediction): Promise<void> {
    const raw = InfraAlgorithmAnalysisMapper.toPersistence(analysis);

    await prisma.$transaction(async (tx) => {
      if (analysis.reliability) {
        const scoreVal = analysis.reliability.score.getScore();
        await tx.reliability.upsert({
          where: { id: raw.id },
          update: { score: scoreVal },
          create: { id: raw.id, score: scoreVal },
        });
      }
    });
  }

  async saveMany(analyses: DomainPrediction[]): Promise<void> {
    if (analyses.length === 0) return;

    const operations: any[] = [];
    for (const entity of analyses) {
      const raw = InfraAlgorithmAnalysisMapper.toPersistence(entity);

      if (entity.reliability) {
        const scoreVal = entity.reliability.score.getScore();
        operations.push(
          prisma.reliability.upsert({
            where: { id: raw.id },
            update: { score: scoreVal },
            create: { id: raw.id, score: scoreVal },
          }),
        );
      }
    }

    await prisma.$transaction(operations);
  }

  async findByUser(visitorId?: string): Promise<DomainPrediction[]> {
    if (!visitorId) return [];

    const results = await prisma.prediction.findMany({
      where: {
        visitorId,
      },
      include: {
        reliability: true,
      },
      orderBy: {
        id: 'desc',
      },
    });

    return results.map((r) => InfraAlgorithmAnalysisMapper.toEntity(r));
  }

  async findBestByEpisodeAndAlgorithm(
    episode: number,
    algorithm: AlgorithmType,
  ): Promise<DomainPrediction | null> {
    const result = await prisma.prediction.findFirst({
      where: {
        episode,
        algorithm,
      },
      include: {
        reliability: true,
      },
      orderBy: {
        reliability: {
          score: 'desc',
        },
      },
    });

    if (!result) return null;
    return InfraAlgorithmAnalysisMapper.toEntity(result);
  }

  async findBestByEpisodeAndReliabilityIsNotNull(
    episode: number,
  ): Promise<DomainPrediction | null> {
    const result = await prisma.prediction.findFirst({
      where: {
        episode,
        reliability: {
          isNot: null,
        },
      },
      include: {
        reliability: true,
        winningNumber: true,
      },
      orderBy: {
        reliability: {
          score: 'desc',
        },
      },
    });

    if (!result) return null;
    return InfraAlgorithmAnalysisMapper.toEntity(result);
  }

  async findWithoutReliability(): Promise<DomainPrediction[]> {
    const results = await prisma.prediction.findMany({
      where: {
        reliability: null,
      },
    });

    return results.map((r) => InfraAlgorithmAnalysisMapper.toEntity(r));
  }

  async count(): Promise<number> {
    return prisma.prediction.count();
  }

  async findRecentEpisodeByReliabilityIsNotNull(): Promise<{
    episode: number;
  } | null> {
    return prisma.prediction.findFirst({
      where: {
        reliability: { isNot: null },
      },
      orderBy: {
        episode: 'desc',
      },
      select: {
        episode: true,
      },
    });
  }

  async getAverageScore(algorithm?: AlgorithmType): Promise<number> {
    const whereClause: any = {};
    if (algorithm) {
      whereClause.prediction = {
        algorithm: algorithm,
      };
    }

    const averageScore = await prisma.reliability.aggregate({
      _avg: { score: true },
      where: whereClause,
    });
    return averageScore._avg.score || 0;
  }
}
