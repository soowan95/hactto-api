import { DomainPersonalAnalysis } from '../../domain/aggregates/personal-analysis.entity';

export const PERSONAL_ANALYSIS_REPOSITORY_TOKEN = 'IPersonalAnalysisRepository';

export interface IPersonalAnalysisRepository {
  findById(id: number): Promise<DomainPersonalAnalysis | null>;
  upsert(analysis: DomainPersonalAnalysis): Promise<void>;
}
