import { getAlgorithm, AlgorithmType, hacttoExecute } from '@hactto/algorithm';
import { AlgorithmResult, WinningNumber } from '../../../lib/prisma';
import { Inject, Injectable } from '@nestjs/common';
import {
  IWinningNumberRepository,
  WINNING_NUMBER_REPOSITORY_TOKEN,
} from '../../winning-number/domain/ports/winning-number.repository.interface';
import {
  IAlgorithmResultRepository,
  ALGORITHM_RESULT_REPOSITORY_TOKEN,
} from '../domain/ports/algorithm-result.repository.interface';

@Injectable()
export class AlgorithmService {
  constructor(
    @Inject(WINNING_NUMBER_REPOSITORY_TOKEN)
    private readonly winningNumberRepository: IWinningNumberRepository,
    @Inject(ALGORITHM_RESULT_REPOSITORY_TOKEN)
    private readonly algorithmResultRepository: IAlgorithmResultRepository,
  ) {}

  allAlgorithmTypes(): AlgorithmType[] {
    return getAlgorithm();
  }

  async initialize(): Promise<void> {
    const types: AlgorithmType[] = this.allAlgorithmTypes();
    const winningNumbers: WinningNumber[] =
      await this.winningNumberRepository.findAll();
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
      await this.winningNumberRepository.findAll();
    const lastestWinningNumber: WinningNumber =
      await this.winningNumberRepository.findLatestWithWinningNumber();
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
    return this.algorithmResultRepository.create({
      algorithm: type,
      episode: episode,
      first: result[0],
      second: result[1],
      third: result[2],
      fourth: result[3],
      fifth: result[4],
      sixth: result[5],
      bonus: result[6],
    });
  }
}
