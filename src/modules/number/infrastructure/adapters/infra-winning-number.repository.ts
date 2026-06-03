import { Injectable } from '@nestjs/common';
import { IWinningNumberRepository } from '../../domain/ports/winning-number.repository.port';
import { prisma } from '../../../../lib/prisma';
import { Prisma, WinningNumber } from '../../../../generated/prisma/client';
import { DomainWinningNumber } from '../../domain/aggregates/winning-number.entity';
import { InfraWinningNumberMapper } from '../mappers/infra-winning-number.mapper';
import { WinningNumberDrawer } from '../../domain/services/winning-number-drawer';

@Injectable()
export class InfraWinningNumberRepository implements IWinningNumberRepository {
  async findAll(
    options?: Prisma.WinningNumberFindManyArgs,
  ): Promise<DomainWinningNumber[]> {
    const results = options
      ? await prisma.winningNumber.findMany(options)
      : await prisma.winningNumber.findMany();
    return results.map((wn) => InfraWinningNumberMapper.toEntity(wn));
  }

  async findByEpisode(episode: number): Promise<DomainWinningNumber> {
    const winningNumber: WinningNumber | null =
      await prisma.winningNumber.findUnique({
        where: { episode: episode },
      });
    if (!winningNumber) return WinningNumberDrawer.drawPlaceholder(episode);
    return InfraWinningNumberMapper.toEntity(winningNumber);
  }

  async findLatestWithWinningNumber(): Promise<DomainWinningNumber | null> {
    const winningNumber: WinningNumber | null =
      await prisma.winningNumber.findFirst({
        where: { isDrawn: true },
        orderBy: { episode: 'desc' },
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
}
