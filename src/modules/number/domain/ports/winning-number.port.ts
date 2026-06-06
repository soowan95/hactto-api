import { DomainWinningNumber } from '../aggregates/winning-number.entity';

export const WINNING_NUMBER_REPOSITORY_TOKEN = 'IWinningNumberRepository';

export interface IWinningNumberRepository {
  findAll(options?: any): Promise<DomainWinningNumber[]>;
  findByEpisode(episode: number): Promise<DomainWinningNumber>;
  findLatestWithWinningNumber(): Promise<DomainWinningNumber | null>;
  upsert(winningNumber: DomainWinningNumber): Promise<void>;
  countByPair(pair: [number, number]): Promise<number>;
}
