import { Injectable } from '@nestjs/common';
import { prisma } from '../../../../lib/prisma';
import { DomainPrediction } from '../../domain/aggregates/prediction.entity';
import { InfraPredictionMapper } from '../mappers/infra-prediction.mapper';
import { IPredictionRepository } from '../../domain/ports/prediction.repository.port';
import { DomainAlgorithm } from '../../domain/aggregates/algorithm.entity';
import { InfraAlgorithmMapper } from '../mappers/infra-algorithm.mapper';

@Injectable()
export class InfraPredictionRepository implements IPredictionRepository {
  async create(analysis: DomainPrediction): Promise<DomainPrediction> {
    const raw = InfraPredictionMapper.toPersistence(analysis);

    const data: any = {
      algorithmType: raw.algorithmType,
      episode: raw.episode,
      weights: raw.weights,
      numbers: raw.numbers,
      visitorId: raw.visitorId,
    };

    const result = await prisma.prediction.create({
      data,
      include: {
        algorithm: true,
      },
    });

    return InfraPredictionMapper.toEntity(result);
  }

  async save(analysis: DomainPrediction): Promise<void> {
    const raw = InfraPredictionMapper.toPersistence(analysis);

    await prisma.$transaction(async (tx) => {
      if (analysis.reliability) {
        const scoreVal = analysis.reliability.getScore();
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

    const predictionsToCreate: any[] = [];
    const reliabilityDataToCreate: { id: number; score: number }[] = [];

    for (const entity of analyses) {
      const raw = InfraPredictionMapper.toPersistence(entity);

      if (!raw.id) {
        predictionsToCreate.push({
          algorithmType: raw.algorithmType,
          episode: raw.episode,
          weights: raw.weights,
          numbers: raw.numbers,
          visitorId: raw.visitorId,
        });
      } else {
        if (entity.reliability) {
          reliabilityDataToCreate.push({
            id: raw.id,
            score: entity.reliability.getScore(),
          });
        }
      }
    }

    if (predictionsToCreate.length > 0) {
      await prisma.prediction.createMany({
        data: predictionsToCreate,
        skipDuplicates: true,
      });
    }

    if (reliabilityDataToCreate.length > 0) {
      await prisma.reliability.createMany({
        data: reliabilityDataToCreate,
        skipDuplicates: true,
      });
    }
  }

  async findAllByAlgorithmAndReliabilityIsNotNull(
    algorithm: DomainAlgorithm,
  ): Promise<DomainPrediction[]> {
    const result = await prisma.prediction.findMany({
      where: {
        algorithm,
        reliability: { isNot: null },
      },
      orderBy: {
        episode: 'desc',
      },
      include: {
        algorithm: true,
        reliability: true,
      },
    });

    return result.map((pr) => InfraPredictionMapper.toEntity(pr));
  }

  async findByUser(visitorId?: string): Promise<DomainPrediction[]> {
    if (!visitorId) return [];

    const results = await prisma.prediction.findMany({
      where: {
        visitorId,
      },
      include: {
        algorithm: true,
        reliability: true,
      },
      orderBy: {
        id: 'desc',
      },
    });

    return results.map((r) => InfraPredictionMapper.toEntity(r));
  }

  async findBestByEpisodeAndAlgorithm(
    episode: number,
    algorithm: DomainAlgorithm,
  ): Promise<DomainPrediction | null> {
    const result = await prisma.prediction.findFirst({
      where: {
        episode,
        algorithm: InfraAlgorithmMapper.toPersistence(algorithm),
      },
      include: {
        algorithm: true,
        reliability: true,
      },
      orderBy: {
        reliability: {
          score: 'desc',
        },
      },
    });

    if (!result) return null;
    return InfraPredictionMapper.toEntity(result);
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
        algorithm: true,
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
    return InfraPredictionMapper.toEntity(result);
  }

  async findWithoutReliability(): Promise<DomainPrediction[]> {
    const results = await prisma.prediction.findMany({
      where: {
        reliability: null,
      },
      include: {
        algorithm: true,
      },
    });

    return results.map((r) => InfraPredictionMapper.toEntity(r));
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

  async groupByAlgorithmTypeHavingEpisode(episode: number): Promise<any> {
    return prisma.prediction.groupBy({
      by: ['algorithmType'],
      where: {
        episode,
      },
      _count: {
        id: true,
      },
    });
  }

  async findAllSystemPredictions(): Promise<DomainPrediction[]> {
    const results = await prisma.prediction.findMany({
      where: {
        visitorId: null,
      },
      include: {
        algorithm: true,
        reliability: true,
      },
    });

    return results.map((r) => InfraPredictionMapper.toEntity(r));
  }
}
