import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { prisma } from '../../lib/prisma';
import { WinningNumber } from '../../generated/prisma/client';

@Injectable()
export class WinningNumberService {
  constructor(private readonly httpService: HttpService) {}

  async findAll(): Promise<WinningNumber[]> {
    return prisma.winningNumber.findMany();
  }

  async findByRound(round: number): Promise<WinningNumber | null> {
    return prisma.winningNumber.findUnique({
      where: { round: round },
    });
  }
}
