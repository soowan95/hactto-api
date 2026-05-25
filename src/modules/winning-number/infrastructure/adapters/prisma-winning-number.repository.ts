import { Injectable } from '@nestjs/common';
import { IWinningNumberRepository } from '../../domain/ports/winning-number.repository.interface';
import { prisma, WinningNumber } from '../../../../lib/prisma';
import { Lt365 } from '../../presentation/dtos/responses/lt365-response.dto';

@Injectable()
export class PrismaWinningNumberRepository implements IWinningNumberRepository {
  async findAll(options?: any): Promise<WinningNumber[]> {
    if (options) return prisma.winningNumber.findMany(options);
    return prisma.winningNumber.findMany();
  }

  async findByEpisode(episode: number): Promise<WinningNumber | null> {
    return prisma.winningNumber.findUnique({
      where: { episode: episode },
    });
  }

  async findLatestWithWinningNumber(): Promise<WinningNumber> {
    return prisma.winningNumber.findFirstOrThrow({
      where: { first: { not: 0 } },
      orderBy: { episode: 'desc' },
    });
  }

  async upsert(lt365: Lt365): Promise<void> {
    await prisma.winningNumber.upsert({
      where: { episode: lt365.ltEpsd },
      update: {
        first: lt365.tm1WnNo,
        second: lt365.tm2WnNo,
        third: lt365.tm3WnNo,
        fourth: lt365.tm4WnNo,
        fifth: lt365.tm5WnNo,
        sixth: lt365.tm6WnNo,
        bonus: lt365.bnsWnNo,
      },
      create: {
        episode: lt365.ltEpsd,
        first: lt365.tm1WnNo,
        second: lt365.tm2WnNo,
        third: lt365.tm3WnNo,
        fourth: lt365.tm4WnNo,
        fifth: lt365.tm5WnNo,
        sixth: lt365.tm6WnNo,
        bonus: lt365.bnsWnNo,
      },
    });
  }

  async createPlaceholder(episode: number): Promise<void> {
    await prisma.winningNumber.create({
      data: {
        episode: episode,
        first: 0,
        second: 0,
        third: 0,
        fourth: 0,
        fifth: 0,
        sixth: 0,
        bonus: 0,
      },
    });
  }
}
