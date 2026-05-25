import { WinningNumber } from '../../../../lib/prisma';
import { Lt365 } from '../../presentation/dtos/responses/lt365-response.dto';

export const WINNING_NUMBER_REPOSITORY_TOKEN = 'IWinningNumberRepository';

export interface IWinningNumberRepository {
  findAll(options?: any): Promise<WinningNumber[]>;
  findByEpisode(episode: number): Promise<WinningNumber | null>;
  findLatestWithWinningNumber(): Promise<WinningNumber>;
  upsert(lt365: Lt365): Promise<void>;
  createPlaceholder(episode: number): Promise<void>;
}
