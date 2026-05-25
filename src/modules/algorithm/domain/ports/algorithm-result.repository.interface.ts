import { AlgorithmResult } from '../../../../lib/prisma';
import { AlgorithmType } from '@hactto/algorithm';

export const ALGORITHM_RESULT_REPOSITORY_TOKEN = 'IAlgorithmResultRepository';

export interface IAlgorithmResultRepository {
  create(data: {
    algorithm: AlgorithmType;
    episode: number;
    first: number;
    second: number;
    third: number;
    fourth: number;
    fifth: number;
    sixth: number;
    bonus: number;
  }): Promise<AlgorithmResult>;
  findWithoutReliability(): Promise<AlgorithmResult[]>;
  count(): Promise<number>;
}
