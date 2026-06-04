import { IWinningNumberAnalysisRepository } from '../../domain/ports/winning-number-analysis.port';
import { DomainWinningNumberAnalysis } from '../../domain/aggregates/winning-number-analysis.entity';
import { prisma } from '../../../../lib/prisma';
import { Injectable } from '@nestjs/common';

@Injectable()
export class InfraWinningNumberAnalysisRepository
  implements IWinningNumberAnalysisRepository
{
  async create(
    winningNumberAnalysis: DomainWinningNumberAnalysis,
  ): Promise<void> {
    await prisma.winningNumberAnalysis.create({
      data: {
        episode: winningNumberAnalysis.episode,
        analysisId: winningNumberAnalysis.analysisId,
      },
    });
  }

  async createMany(
    winningNumberAnalyses: DomainWinningNumberAnalysis[],
  ): Promise<void> {
    if (winningNumberAnalyses.length === 0) return;
    await prisma.winningNumberAnalysis.createMany({
      data: winningNumberAnalyses.map((wna) => ({
        episode: wna.episode,
        analysisId: wna.analysisId,
      })),
      skipDuplicates: true,
    });
  }
}
