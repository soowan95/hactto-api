import { Injectable, Logger } from '@nestjs/common';
import { AlgorithmService } from '../algorithm/algorithm.service';
import { AlgorithmType } from '@hactto/algorithm';
import { WinningNumberService } from '../winning-number/winning-number.service';
import { AlgorithmResult, prisma, WinningNumber } from '../../lib/prisma';

@Injectable()
export class ReliabilityService {
  private readonly log = new Logger(ReliabilityService.name);

  constructor(
    private readonly algorithmService: AlgorithmService,
    private readonly winningNumberService: WinningNumberService,
  ) {}

  async analyze(type?: string): Promise<void> {
    let types: AlgorithmType[] = [];
    if (type) types.push(type as AlgorithmType);
    else types = this.algorithmService.allAlgorithmTypes();

    const winningNumbers: WinningNumber[] =
      await this.winningNumberService.findAll({
        orderBy: { episode: 'asc' },
      });
    const data: number[][] = winningNumbers.map((winningNumber) =>
      winningNumber.getNumberArray(),
    );

    const reliabilityDataList: any[] = [];

    for (const type of types) {
      for (let i = 1; i < data.length; i++) {
        const subData: number[][] = data.slice(0, i);
        const result: AlgorithmResult =
          await this.algorithmService.executeAlgorithm(type, subData);
        const reliability: number = await this.calculateReliability(
          data[i],
          result.getNumberArray(),
        );

        reliabilityDataList.push({
          id: result.id,
          algorithm: type,
          episode: i + 1,
          score: reliability,
        });
      }
    }

    if (reliabilityDataList.length > 0) {
      await prisma.reliability.createMany({
        data: reliabilityDataList,
        skipDuplicates: true,
      });
    }
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
