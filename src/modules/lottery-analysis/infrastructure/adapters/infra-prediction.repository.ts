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
      if (analysis.analysis) {
        const data = {
          reliability: analysis.analysis.getScore(),
          even: analysis.analysis.even,
          odd: analysis.analysis.odd,
          hot: analysis.analysis.hot,
          warm: analysis.analysis.warm,
          cold: analysis.analysis.cold,
          low: analysis.analysis.low,
          high: analysis.analysis.high,
          ac: analysis.analysis.ac,
          consecutive: JSON.stringify(analysis.analysis.consecutive),
        };
        await tx.analysis.upsert({
          where: { id: raw.id },
          update: data,
          create: { id: raw.id, ...data },
        });
      }
    });
  }

  async saveMany(analyses: DomainPrediction[]): Promise<void> {
    if (analyses.length === 0) return;

    const predictionsToCreate: any[] = [];
    const analysisDataToCreate: any[] = [];

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
        if (entity.analysis) {
          analysisDataToCreate.push({
            id: raw.id,
            reliability: entity.analysis.getScore(),
            even: entity.analysis.even,
            odd: entity.analysis.odd,
            hot: entity.analysis.hot,
            warm: entity.analysis.warm,
            cold: entity.analysis.cold,
            low: entity.analysis.low,
            high: entity.analysis.high,
            ac: entity.analysis.ac,
            consecutive: JSON.stringify(entity.analysis.consecutive),
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

    if (analysisDataToCreate.length > 0) {
      await prisma.analysis.createMany({
        data: analysisDataToCreate,
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
        analysis: { isNot: null },
      },
      orderBy: {
        episode: 'desc',
      },
      include: {
        algorithm: true,
        analysis: true,
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
        analysis: true,
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
        analysis: true,
      },
      orderBy: {
        analysis: {
          reliability: 'desc',
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
        analysis: {
          isNot: null,
        },
      },
      include: {
        algorithm: true,
        analysis: true,
        winningNumber: true,
      },
      orderBy: {
        analysis: {
          reliability: 'desc',
        },
      },
    });

    if (!result) return null;
    return InfraPredictionMapper.toEntity(result);
  }

  async findWithoutAnalysis(): Promise<DomainPrediction[]> {
    const results = await prisma.prediction.findMany({
      where: {
        analysis: null,
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
        analysis: { isNot: null },
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
        analysis: true,
      },
    });

    return results.map((r) => InfraPredictionMapper.toEntity(r));
  }
}
