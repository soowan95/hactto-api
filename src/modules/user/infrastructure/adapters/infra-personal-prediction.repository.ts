import { Injectable } from '@nestjs/common';
import { IPersonalPredictionRepository } from '../../domain/ports/personal-prediction.port';
import { DomainPersonalPrediction } from '../../domain/aggregates/personal-perdiction.entity';
import { DomainPersonalAnalysis } from '../../domain/aggregates/personal-analysis.entity';
import { prisma } from '../../../../libs/prisma';
import { InfraPersonalPredictionMapper } from '../mappers/infra-personal-prediction.mapper';
import { InfraPersonalAnalysisMapper } from '../mappers/infra-personal-analysis.mapper';

@Injectable()
export class InfraPersonalPredictionRepository implements IPersonalPredictionRepository {
  async save(
    prediction: DomainPersonalPrediction,
    analysis: DomainPersonalAnalysis,
  ): Promise<void> {
    const predictionData =
      InfraPersonalPredictionMapper.toPersistence(prediction);
    const analysisData = InfraPersonalAnalysisMapper.toPersistence({
      ...analysis,
      id: 0, // nested create 시 id는 Prisma가 자동 부여
    } as DomainPersonalAnalysis);

    // id 제거 (nested create 시 personalPrediction.id를 그대로 사용)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _omit, ...analysisWithoutId } = analysisData;

    await prisma.personalPrediction.create({
      data: {
        ...predictionData,
        personalAnalysis: {
          create: analysisWithoutId,
        },
      },
    });
  }

  async findByUser(visitorId: string): Promise<
    {
      prediction: DomainPersonalPrediction;
      analysis: DomainPersonalAnalysis | null;
    }[]
  > {
    const results = await prisma.personalPrediction.findMany({
      where: { visitorId },
      include: {
        personalAnalysis: true,
      },
      orderBy: {
        id: 'desc',
      },
    });

    return results.map((row) => {
      const prediction = new DomainPersonalPrediction(
        row.visitorId,
        row.episode,
        [
          row.pp1WnNo,
          row.pp2WnNo,
          row.pp3WnNo,
          row.pp4WnNo,
          row.pp5WnNo,
          row.pp6WnNo,
        ],
        row.id,
      );

      const analysis = row.personalAnalysis
        ? InfraPersonalAnalysisMapper.toEntity(row.personalAnalysis)
        : null;

      return { prediction, analysis };
    });
  }
}
