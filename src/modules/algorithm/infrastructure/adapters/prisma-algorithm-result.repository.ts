import { Injectable } from '@nestjs/common';
import { IAlgorithmResultRepository } from '../../domain/ports/algorithm-result.repository.interface';
import { prisma, AlgorithmResult } from '../../../../lib/prisma';
import { AlgorithmType } from '@hactto/algorithm';

@Injectable()
export class PrismaAlgorithmResultRepository implements IAlgorithmResultRepository {
  async create(data: {
    algorithm: AlgorithmType;
    episode: number;
    first: number;
    second: number;
    third: number;
    fourth: number;
    fifth: number;
    sixth: number;
    bonus: number;
  }): Promise<AlgorithmResult> {
    return prisma.algorithmResult.create({
      data: {
        algorithm: data.algorithm,
        episode: data.episode,
        first: data.first,
        second: data.second,
        third: data.third,
        fourth: data.fourth,
        fifth: data.fifth,
        sixth: data.sixth,
        bonus: data.bonus,
      },
    });
  }

  async findWithoutReliability(): Promise<AlgorithmResult[]> {
    return prisma.algorithmResult.findMany({
      where: {
        reliability: undefined,
      },
    });
  }

  async count(): Promise<number> {
    return prisma.algorithmResult.count();
  }
}
