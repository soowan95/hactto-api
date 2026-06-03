import { AnalysisWinningNumber } from '../aggregates/winning-number.entity';

export const WINNING_NUMBER_READER_TOKEN = 'IWinningNumberReader';

export interface FindAllWinningNumbersOptions {
  episodeIn?: number[];
  orderByEpisode?: 'asc' | 'desc';
}

export interface WinningNumberReader {
  findByEpisode(episode: number): Promise<AnalysisWinningNumber | null>;
  findAll(
    options?: FindAllWinningNumbersOptions,
  ): Promise<AnalysisWinningNumber[]>;
  findLatestWithWinningNumber(): Promise<AnalysisWinningNumber | null>;
}
