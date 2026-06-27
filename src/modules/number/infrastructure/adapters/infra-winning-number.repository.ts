import { Injectable } from '@nestjs/common';
import { IWinningNumberRepository } from '../../domain/ports/winning-number.port';
import { prisma } from '../../../../libs/prisma';
import { Prisma } from '../../../../generated/prisma/client';
import { DomainWinningNumber } from '../../domain/aggregates/winning-number.entity';
import { InfraWinningNumberMapper } from '../mappers/infra-winning-number.mapper';
import { WinningNumberDrawer } from '../../domain/services/winning-number-drawer';

@Injectable()
export class InfraWinningNumberRepository implements IWinningNumberRepository {
  async findAll(
    options?: Prisma.WinningNumberFindManyArgs,
  ): Promise<DomainWinningNumber[]> {
    const includeOption = {
      include: {
        winningNumberAnalysis: {
          include: {
            analysis: true,
          },
        },
      },
    };
    const results = options
      ? await prisma.winningNumber.findMany({ ...options, ...includeOption })
      : await prisma.winningNumber.findMany(includeOption);
    return results.map((wn) => InfraWinningNumberMapper.toEntity(wn));
  }

  async findByEpisode(episode: number): Promise<DomainWinningNumber> {
    const winningNumber = await prisma.winningNumber.findUnique({
      where: { episode: episode },
      include: {
        winningNumberAnalysis: {
          include: {
            analysis: true,
          },
        },
      },
    });
    if (!winningNumber) return WinningNumberDrawer.drawPlaceholder(episode);
    return InfraWinningNumberMapper.toEntity(winningNumber);
  }

  async findLatestWithWinningNumber(): Promise<DomainWinningNumber | null> {
    const winningNumber = await prisma.winningNumber.findFirst({
      where: { isDrawn: true },
      orderBy: { episode: 'desc' },
      include: {
        winningNumberAnalysis: {
          include: {
            analysis: true,
          },
        },
      },
    });
    if (!winningNumber) return null;
    return InfraWinningNumberMapper.toEntity(winningNumber);
  }

  async upsert(winningNumber: DomainWinningNumber): Promise<void> {
    const data = InfraWinningNumberMapper.toPersistence(winningNumber);
    await prisma.winningNumber.upsert({
      where: { episode: winningNumber.episode },
      update: data,
      create: data,
    });
  }

  async countByPair(pair: [number, number]): Promise<number> {
    const [a, b] = pair;

    return prisma.winningNumber.count({
      where: {
        AND: [
          {
            OR: [
              { lt1WnNo: a },
              { lt2WnNo: a },
              { lt3WnNo: a },
              { lt4WnNo: a },
              { lt5WnNo: a },
              { lt6WnNo: a },
            ],
          },
          {
            OR: [
              { lt1WnNo: b },
              { lt2WnNo: b },
              { lt3WnNo: b },
              { lt4WnNo: b },
              { lt5WnNo: b },
              { lt6WnNo: b },
            ],
          },
        ],
      },
    });
  }
}
