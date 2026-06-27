import { FetchWinningNumbersHandler } from './command-handlers/fetch-winning-numbers.handler';
import { FetchRecentWinningNumberHandler } from './command-handlers/fetch-recent-winning-number.handler';
import { GetAllWinningNumbersHandler } from './query-handlers/get-all-winning-numbers.handler';
import { GetLatestWinningNumberHandler } from './query-handlers/get-latest-winning-number.handler';
import { GetWinningNumberByEpisodeHandler } from './query-handlers/get-winning-number-by-episode.handler';
import { WinningNumberDrawnHandler } from './event-handlers/winning-number-drawn.handler';
import { GetLotteryBallStatusHandler } from './query-handlers/get-lottery-ball-status.handler';

export const CommandHandlers = [
  FetchWinningNumbersHandler,
  FetchRecentWinningNumberHandler,
];

export const QueryHandlers = [
  GetAllWinningNumbersHandler,
  GetLatestWinningNumberHandler,
  GetWinningNumberByEpisodeHandler,
  GetLotteryBallStatusHandler,
];

export const EventHandlers = [WinningNumberDrawnHandler];
