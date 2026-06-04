import { IPredictionAnalysisRepository } from '../../domain/ports/prediction-analysis.port';
import { DomainPredictionAnalysis } from '../../domain/aggregates/prediction-analysis.entity';
import { prisma } from '../../../../lib/prisma';

export class InfraPredictionAnalysisRepository implements IPredictionAnalysisRepository {
  async insert(predictionAnalysis: DomainPredictionAnalysis): Promise<void> {
    await prisma.predictionAnalysis.create({
      data: {
        predictionId: predictionAnalysis.predictionId,
        analysisId: predictionAnalysis.analysisId,
      },
    });
  }
}
