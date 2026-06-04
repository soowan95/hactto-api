import { DomainWinningNumberAnalysis } from '../aggregates/winning-number-analysis.entity';

export const WINNING_NUMBER_ANALYSIS_REPOSITORY_TOKEN =
  'IWinningNumberAnalysisRepository';

export interface IWinningNumberAnalysisRepository {
  create(winningNumberAnalysis: DomainWinningNumberAnalysis): Promise<void>;
  createMany(
    winningNumberAnalyses: DomainWinningNumberAnalysis[],
  ): Promise<void>;
}
