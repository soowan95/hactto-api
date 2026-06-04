import { Injectable } from '@nestjs/common';
import { prisma } from '../../../../lib/prisma';
import { DomainPrediction } from '../../domain/aggregates/prediction.entity';
import { InfraPredictionMapper } from '../mappers/infra-prediction.mapper';
import { IPredictionRepository } from '../../domain/ports/prediction.port';
import { DomainAlgorithm } from '../../domain/aggregates/algorithm.entity';
import { InfraAlgorithmMapper } from '../mappers/infra-algorithm.mapper';
import { DomainAnalysis } from '../../domain/aggregates/analysis.entity';

@Injectable()
export class InfraPredictionRepository implements IPredictionRepository {
  async create(prediction: DomainPrediction): Promise<DomainPrediction> {
    const raw = InfraPredictionMapper.toPersistence(prediction);

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

    return InfraPredictionMapper.toEntity({
      ...result,
      analysis: DomainAnalysis.dummy(),
    });
  }

  async save(prediction: DomainPrediction): Promise<void> {
    if (prediction.analysis && prediction.analysis.id) {
      await prisma.analysis.update({
        where: { id: prediction.analysis.id },
        data: {
          reliability: prediction.analysis.getReliability(),
          even: prediction.analysis.even,
          odd: prediction.analysis.odd,
          hot: prediction.analysis.hot,
          warm: prediction.analysis.warm,
          cold: prediction.analysis.cold,
          low: prediction.analysis.low,
          high: prediction.analysis.high,
          ac: prediction.analysis.ac,
          consecutive: JSON.stringify(prediction.analysis.consecutive),
        },
      });
    }
  }

  async saveMany(analyses: DomainPrediction[]): Promise<void> {
    if (analyses.length === 0) return;

    const predictionsToCreate: DomainPrediction[] = [];
    const predictionsToUpdate: DomainPrediction[] = [];

    for (const entity of analyses) {
      if (!entity.id) {
        predictionsToCreate.push(entity);
      } else {
        predictionsToUpdate.push(entity);
      }
    }

    const batchSize = 100;

    if (predictionsToCreate.length > 0) {
      for (let i = 0; i < predictionsToCreate.length; i += batchSize) {
        const batch = predictionsToCreate.slice(i, i + batchSize);
        await prisma.$transaction(
          batch.map((entity) => {
            const raw = InfraPredictionMapper.toPersistence(entity);
            return prisma.prediction.create({
              data: {
                algorithmType: raw.algorithmType,
                episode: raw.episode,
                weights: raw.weights,
                numbers: raw.numbers,
                visitorId: raw.visitorId,
                predictionAnalysis: {
                  create: {
                    analysis: {
                      create: {
                        reliability: entity.analysis.getReliability(),
                        even: entity.analysis.even,
                        odd: entity.analysis.odd,
                        hot: entity.analysis.hot,
                        warm: entity.analysis.warm,
                        cold: entity.analysis.cold,
                        low: entity.analysis.low,
                        high: entity.analysis.high,
                        ac: entity.analysis.ac,
                        consecutive: JSON.stringify(
                          entity.analysis.consecutive,
                        ),
                      },
                    },
                  },
                },
              },
            });
          }),
          { timeout: 30000 },
        );
      }
    }

    if (predictionsToUpdate.length > 0) {
      for (let i = 0; i < predictionsToUpdate.length; i += batchSize) {
        const batch = predictionsToUpdate.slice(i, i + batchSize);
        await prisma.$transaction(
          batch
            .map((entity) => {
              if (entity.analysis && entity.analysis.id) {
                return prisma.analysis.update({
                  where: { id: entity.analysis.id },
                  data: {
                    reliability: entity.analysis.getReliability(),
                    even: entity.analysis.even,
                    odd: entity.analysis.odd,
                    hot: entity.analysis.hot,
                    warm: entity.analysis.warm,
                    cold: entity.analysis.cold,
                    low: entity.analysis.low,
                    high: entity.analysis.high,
                    ac: entity.analysis.ac,
                    consecutive: JSON.stringify(entity.analysis.consecutive),
                  },
                });
              }
            })
            .filter(Boolean) as any[],
          { timeout: 30000 },
        );
      }
    }
  }

  async findAllByAlgorithmAndReliabilityIsNotNull(
    algorithm: DomainAlgorithm,
  ): Promise<DomainPrediction[]> {
    const result = await prisma.prediction.findMany({
      where: {
        algorithm,
        predictionAnalysis: { isNot: null },
      },
      orderBy: {
        episode: 'desc',
      },
      include: {
        algorithm: true,
        predictionAnalysis: {
          include: { analysis: true },
        },
      },
    });

    return result.map((pr) => {
      const predictionAnalysis = pr.predictionAnalysis;
      return InfraPredictionMapper.toEntity({
        ...pr,
        analysis: predictionAnalysis!.analysis,
      });
    });
  }

  async findByUser(visitorId?: string): Promise<DomainPrediction[]> {
    if (!visitorId) return [];

    const results = await prisma.prediction.findMany({
      where: {
        visitorId,
      },
      include: {
        algorithm: true,
        predictionAnalysis: { include: { analysis: true } },
      },
      orderBy: {
        id: 'desc',
      },
    });

    return results.map((pr) => {
      const predictionAnalysis = pr.predictionAnalysis;
      return InfraPredictionMapper.toEntity({
        ...pr,
        analysis: predictionAnalysis!.analysis,
      });
    });
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
        predictionAnalysis: { include: { analysis: true } },
      },
      orderBy: {
        predictionAnalysis: {
          analysis: {
            reliability: 'desc',
          },
        },
      },
    });

    if (!result) return null;

    const predictionAnalysis = result.predictionAnalysis;

    return InfraPredictionMapper.toEntity({
      ...result,
      analysis: predictionAnalysis!.analysis,
    });
  }

  async findBestByEpisodeAndReliabilityIsNotNull(
    episode: number,
  ): Promise<DomainPrediction | null> {
    const result = await prisma.prediction.findFirst({
      where: {
        episode,
        predictionAnalysis: {
          isNot: null,
        },
      },
      include: {
        algorithm: true,
        predictionAnalysis: { include: { analysis: true } },
        winningNumber: true,
      },
      orderBy: {
        predictionAnalysis: {
          analysis: {
            reliability: 'desc',
          },
        },
      },
    });

    if (!result) return null;

    const predictionAnalysis = result.predictionAnalysis;

    return InfraPredictionMapper.toEntity({
      ...result,
      analysis: predictionAnalysis!.analysis,
    });
  }

  async findWithoutAnalysisReliability(): Promise<DomainPrediction[]> {
    const results = await prisma.prediction.findMany({
      where: {
        predictionAnalysis: {
          analysis: {
            reliability: 0,
          },
        },
      },
      include: {
        algorithm: true,
        predictionAnalysis: { include: { analysis: true } },
      },
    });

    return results.map((pr) => {
      const predictionAnalysis = pr.predictionAnalysis;

      return InfraPredictionMapper.toEntity({
        ...pr,
        analysis: predictionAnalysis!.analysis,
      });
    });
  }

  async count(): Promise<number> {
    return prisma.prediction.count();
  }

  async findRecentEpisodeByReliabilityIsNotZero(): Promise<{
    episode: number;
  } | null> {
    return prisma.prediction.findFirst({
      where: {
        predictionAnalysis: {
          analysis: {
            reliability: {
              not: 0,
            },
          },
        },
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
        predictionAnalysis: { include: { analysis: true } },
      },
    });

    return results.map((pr) => {
      const predictionAnalysis = pr.predictionAnalysis;
      return InfraPredictionMapper.toEntity({
        ...pr,
        analysis: predictionAnalysis?.analysis || DomainAnalysis.dummy(),
      });
    });
  }
}
