export interface ExternalLotteryData {
  episode: number;
  numbers: number[];
}

export const WINNING_NUMBER_FETCHER_TOKEN = 'IWinningNumberFetcher';

export interface IWinningNumberFetcher {
  fetchByEpisode(episode: number): Promise<ExternalLotteryData[]>;
  fetchRecentOne(): Promise<ExternalLotteryData>;
}
