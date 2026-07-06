export interface ExternalLotteryData {
  episode: number;
  numbers: number[];
}

export interface ExternalWinningShop {
  rank: number;
  sortOrder: number;
  shopName: string;
  shopAddress: string;
  purchaseType: string;
  region: string;
  shopLatitude: number | null;
  shopLongitude: number | null;
}

export const WINNING_NUMBER_FETCHER_TOKEN = 'IWinningNumberFetcher';

export interface IWinningNumberFetcher {
  fetchByEpisode(episode: number): Promise<ExternalLotteryData[]>;
  fetchRecentOne(): Promise<ExternalLotteryData>;
  fetchShopsByEpisode(episode: number): Promise<ExternalWinningShop[]>;
}
