import { Injectable } from '@nestjs/common';
import { IWinningNumberRepository } from '../../domain/ports/winning-number.repository.interface';
import { prisma } from '../../../../lib/prisma';
import {
  Prisma,
  WinningNumber as InfraWinningNumber,
} from '../../../../generated/prisma/client';
import { WinningNumber as EntityWinningNumber } from '../../domain/entities/winning-number.entity';
import { InfraWinningNumberMapper } from '../mappers/infra-winning-number.mapper';

@Injectable()
export class InfraWinningNumberRepository implements IWinningNumberRepository {
  async findAll(
    options?: Prisma.WinningNumberFindManyArgs,
  ): Promise<EntityWinningNumber[]> {
    const results = options
      ? await prisma.winningNumber.findMany(options)
      : await prisma.winningNumber.findMany();
    return results.map((wn) => InfraWinningNumberMapper.toEntity(wn));
  }

  async findByEpisode(episode: number): Promise<EntityWinningNumber> {
    const winningNumber: InfraWinningNumber | null =
      await prisma.winningNumber.findUnique({
        where: { episode: episode },
      });
    if (!winningNumber) return EntityWinningNumber.placeholder(episode);
    return InfraWinningNumberMapper.toEntity(winningNumber);
  }

  async findLatestWithWinningNumber(): Promise<EntityWinningNumber | null> {
    const winningNumber: InfraWinningNumber | null =
      await prisma.winningNumber.findFirst({
        where: { isDrawn: true },
        orderBy: { episode: 'desc' },
      });
    if (!winningNumber) return null;
    return InfraWinningNumberMapper.toEntity(winningNumber);
  }

  async upsert(winningNumber: EntityWinningNumber): Promise<void> {
    const data = InfraWinningNumberMapper.toPersistence(winningNumber);
    await prisma.winningNumber.upsert({
      where: { episode: winningNumber.episode },
      update: data,
      create: data,
    });
  }

  async createPlaceholder(winningNumber: EntityWinningNumber): Promise<void> {
    const data = InfraWinningNumberMapper.toPersistence(winningNumber);
    await prisma.winningNumber.create({
      data: data,
    });
  }
}
