import { SetPersonalWeightHandler } from './command-handlers/set-personal-weight.handler';
import { GeneratePredictionHandler } from './command-handlers/generate-prediction.handler';
import { AnalyzeReliabilityHandler } from './command-handlers/analyze-reliability.handler';
import { GetPredictionHistoryHandler } from './query-handlers/get-prediction-history.handler';
import { GetPersonalWeightHandler } from './query-handlers/get-personal-weight.handler';
import { GetAverageReliabilityHandler } from './query-handlers/get-average-reliability.handler';
import { GetAverageReliabilitiesHandler } from './query-handlers/get-average-reliabilities.handler';
import { GetLatestBestPredictionHandler } from './query-handlers/get-latest-best-prediction.handler';
import { GetUpcomingPredictionCountsHandler } from './query-handlers/get-upcoming-prediction-counts.handler';
import { GetAlgorithmReliabilityHistoryHandler } from './query-handlers/get-algorithm-reliability-history.handler';
import { GetEpisodeBestPredictionHandler } from './query-handlers/get-episode-best-prediction.handler';
import { PredictionGeneratedHandler } from './event-handlers/prediction-generated.handler';
import { PredictionReliabilityCalculatedHandler } from './event-handlers/prediction-reliability-calculated.handler';

export const CommandHandlers = [
  SetPersonalWeightHandler,
  GeneratePredictionHandler,
  AnalyzeReliabilityHandler,
];

export const QueryHandlers = [
  GetPredictionHistoryHandler,
  GetPersonalWeightHandler,
  GetAverageReliabilityHandler,
  GetAverageReliabilitiesHandler,
  GetLatestBestPredictionHandler,
  GetUpcomingPredictionCountsHandler,
  GetAlgorithmReliabilityHistoryHandler,
  GetEpisodeBestPredictionHandler,
];

export const EventHandlers = [
  PredictionGeneratedHandler,
  PredictionReliabilityCalculatedHandler,
];
