export const RELIABILITY_REPOSITORY_TOKEN = 'IReliabilityRepository';

export interface IReliabilityRepository {
  getAverageScore(algorithm?: string): Promise<number>;
}
