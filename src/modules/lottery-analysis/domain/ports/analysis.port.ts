import { DomainAnalysis } from '../aggregates/analysis.entity';

export const ANALYSIS_REPOSITORY_TOKEN = 'IAnalysisRepository';

export interface IAnalysisRepository {
  insert(analysis: DomainAnalysis): Promise<DomainAnalysis>;
  update(analysis: DomainAnalysis): Promise<void>;
  getAverageScore(algorithm?: string): Promise<number>;
}
