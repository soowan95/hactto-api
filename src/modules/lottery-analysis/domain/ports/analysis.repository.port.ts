export const RELIABILITY_ANALYSIS_TOKEN = 'IAnalysisRepository';

export interface IAnalysisRepository {
  getAverageScore(algorithm?: string): Promise<number>;
}
