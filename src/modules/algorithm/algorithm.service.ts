import { getAlgorithm, AlgorithmType, hacttoExecute } from '@hactto/algorithm';
import { AlgorithmResult, prisma, WinningNumber } from '../../lib/prisma';
import { Injectable } from '@nestjs/common';
import { WinningNumberService } from '../winning-number/winning-number.service';

@Injectable()
export class AlgorithmService {
  constructor(private readonly winningNumberService: WinningNumberService) {}

  allAlgorithmTypes(): AlgorithmType[] {
    return getAlgorithm();
  }

  async initialize(): Promise<void> {
    const types: AlgorithmType[] = this.allAlgorithmTypes();
    const winningNumbers: WinningNumber[] =
      await this.winningNumberService.findAll();
    const data: number[][] = winningNumbers.map((winningNumber) =>
      winningNumber.getNumberArray(),
    );

    for (const type of types) {
      for (let i = 1; i < data.length; i++) {
        const subData: number[][] = data.slice(0, i);
        await this.executeAlgorithm(type, i + 1, subData);
      }
    }
  }

  async generate(type: AlgorithmType): Promise<AlgorithmResult> {
    const winningNumbers: WinningNumber[] =
      await prisma.winningNumber.findMany();
    const lastestWinningNumber: WinningNumber =
      await prisma.winningNumber.findFirstOrThrow({
        where: { first: { not: 0 } },
        orderBy: { episode: 'desc' },
      });
    const lastestEpisode: number = lastestWinningNumber.episode;
    return this.executeAlgorithm(
      type,
      lastestEpisode + 1,
      winningNumbers.map((winningNumber) => winningNumber.getNumberArray()),
    );
  }

  private async executeAlgorithm(
    type: AlgorithmType,
    episode: number,
    data: number[][],
  ): Promise<AlgorithmResult> {
    const result: number[] = await hacttoExecute(type, data);
    return prisma.algorithmResult.create({
      data: {
        algorithm: type,
        episode: episode,
        first: result[0],
        second: result[1],
        third: result[2],
        fourth: result[3],
        fifth: result[4],
        sixth: result[5],
        bonus: result[6],
      },
    });
  }
}
