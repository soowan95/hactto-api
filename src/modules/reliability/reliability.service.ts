import { Injectable, Logger } from '@nestjs/common';
import { AlgorithmService } from '../algorithm/algorithm.service';
import { AlgorithmType } from '@hactto/algorithm';
import { AlgorithmResult, prisma, WinningNumber } from '../../lib/prisma';
import { ReliabilityAverageResponseDto } from './dtos/responses/reliability-average-response.dto';

@Injectable()
export class ReliabilityService {
  private readonly log = new Logger(ReliabilityService.name);

  constructor(private readonly algorithmService: AlgorithmService) {}

  async analyze(): Promise<void> {
    const isExistAtLeastOneAlgorithmResult: boolean =
      (await prisma.algorithmResult.count()) > 0;

    if (!isExistAtLeastOneAlgorithmResult)
      await this.algorithmService.initialize();

    const targetAlgorithmResults: AlgorithmResult[] =
      await prisma.algorithmResult.findMany({
        where: {
          reliability: undefined,
        },
      });

    const reliabilityDataList: any[] = [];

    for (const result of targetAlgorithmResults) {
      const winningNumber: WinningNumber =
        await prisma.winningNumber.findFirstOrThrow({
          where: { episode: result.episode },
        });
      if (!winningNumber.isNonZero()) continue;
      const reliability: number = await this.calculateReliability(
        winningNumber.getNumberArray(),
        result.getNumberArray(),
      );

      reliabilityDataList.push({
        id: result.id,
        score: reliability,
      });
    }

    if (reliabilityDataList.length > 0) {
      await prisma.reliability.createMany({
        data: reliabilityDataList,
        skipDuplicates: true,
      });
    }
  }

  async getAverageScore(
    type?: AlgorithmType,
  ): Promise<ReliabilityAverageResponseDto> {
    const averageScore = await prisma.reliability.aggregate({
      _avg: { score: true },
      where: { algorithmResult: { algorithm: type } },
    });
    return {
      type: type!,
      average: averageScore._avg.score || 0,
    };
  }

  private async calculateReliability(
    winningNumber: number[],
    generatedNumber: number[],
  ): Promise<number> {
    if (generatedNumber.every((num) => num === 0)) return -1;
    const WEIGHTS: number[] = [25, 20, 15, 15, 10, 10, 5];
    const maxScore: number = WEIGHTS.reduce((sum, weight) => sum + weight, 0);

    let score: number = 0;

    for (let i = 0; i < WEIGHTS.length; i++) {
      const winningNumberValue = winningNumber[i];
      const generatedNumberValue = generatedNumber[i];
      const weight = WEIGHTS[i];

      const distance = Math.abs(winningNumberValue - generatedNumberValue);

      const positionScore = weight / (1 + distance);

      score += positionScore;
    }

    return Math.round((score / maxScore) * 100 * 100) / 100;
  }
}
