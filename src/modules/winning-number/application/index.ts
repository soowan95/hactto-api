import { FetchWinningNumbersHandler } from './commands/fetch-winning-numbers/fetch-winning-numbers.handler';
import { FetchRecentWinningNumberHandler } from './commands/fetch-recent-winning-number/fetch-recent-winning-number.handler';
import { GetAllWinningNumbersHandler } from './queries/get-all-winning-numbers/get-all-winning-numbers.handler';
import { GetLatestWinningNumberHandler } from './queries/get-latest-winning-number/get-latest-winning-number.handler';
import { GetWinningNumberByEpisodeHandler } from './queries/get-winning-number-by-episode/get-winning-number-by-episode.handler';

export const CommandHandlers = [
  FetchWinningNumbersHandler,
  FetchRecentWinningNumberHandler,
];

export const QueryHandlers = [
  GetAllWinningNumbersHandler,
  GetLatestWinningNumberHandler,
  GetWinningNumberByEpisodeHandler,
];
