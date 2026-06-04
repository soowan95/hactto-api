import {
  FindAllWinningNumbersOptions,
  WinningNumberReader,
} from '../../domain/ports/winning-number-reader.port';
import { Inject, Injectable } from '@nestjs/common';
import {
  IWinningNumberRepository,
  WINNING_NUMBER_REPOSITORY_TOKEN,
} from '../../../number/domain/ports/winning-number.port';
import { WinningNumberMapper } from '../mappers/winning-number.mapper';

import { AnalysisWinningNumber } from '../../domain/aggregates/winning-number.entity';

@Injectable()
export class WinningNumberAdapter implements WinningNumberReader {
  constructor(
    @Inject(WINNING_NUMBER_REPOSITORY_TOKEN)
    private readonly winningNumberRepository: IWinningNumberRepository,
    private readonly mapper: WinningNumberMapper,
  ) {}

  async findByEpisode(episode: number): Promise<AnalysisWinningNumber | null> {
    const winningNumber =
      await this.winningNumberRepository.findByEpisode(episode);
    if (!winningNumber) return null;
    return this.mapper.toAnalysisModel(winningNumber);
  }

  async findAll(
    options?: FindAllWinningNumbersOptions,
  ): Promise<AnalysisWinningNumber[]> {
    const dbOptions: any = {};
    if (options?.episodeIn) {
      dbOptions.where = {
        episode: { in: options.episodeIn },
      };
    }
    if (options?.orderByEpisode) {
      dbOptions.orderBy = {
        episode: options.orderByEpisode,
      };
    }

    const winningNumbers =
      await this.winningNumberRepository.findAll(dbOptions);
    return winningNumbers.map((wn) => this.mapper.toAnalysisModel(wn));
  }

  async findLatestWithWinningNumber(): Promise<AnalysisWinningNumber | null> {
    const winningNumber =
      await this.winningNumberRepository.findLatestWithWinningNumber();
    if (!winningNumber) return null;
    return this.mapper.toAnalysisModel(winningNumber);
  }
}
