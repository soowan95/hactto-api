import { WinningNumber } from '../entities/winning-number.entity';

export const WINNING_NUMBER_REPOSITORY_TOKEN = 'IWinningNumberRepository';

export interface IWinningNumberRepository {
  findAll(options?: any): Promise<WinningNumber[]>;
  findByEpisode(episode: number): Promise<WinningNumber>;
  findLatestWithWinningNumber(): Promise<WinningNumber | null>;
  upsert(winningNumber: WinningNumber): Promise<void>;
  createPlaceholder(winningNumber: WinningNumber): Promise<void>;
}
