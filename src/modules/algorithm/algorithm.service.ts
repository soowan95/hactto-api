import { getAlgorithm, AlgorithmType, hacttoExecute } from '@hactto/algorithm';
import { AlgorithmResult, prisma } from '../../lib/prisma';

export class AlgorithmService {
  allAlgorithmTypes(): AlgorithmType[] {
    return getAlgorithm();
  }

  async executeAlgorithm(
    type: AlgorithmType,
    data: number[][],
  ): Promise<AlgorithmResult> {
    const result: number[] = await hacttoExecute(type, data);
    return prisma.algorithmResult.create({
      data: {
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
