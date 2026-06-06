import { SetPersonalWeightHandler } from './command-handlers/set-personal-weight.handler';
import { GeneratePredictionHandler } from './command-handlers/generate-prediction.handler';
import { AnalyzeHandler } from './command-handlers/analyze.handler';
import { GetPredictionHistoryHandler } from './query-handlers/get-prediction-history.handler';
import { GetPersonalWeightHandler } from './query-handlers/get-personal-weight.handler';
import { GetAverageReliabilityHandler } from './query-handlers/get-average-reliability.handler';
import { GetAverageReliabilitiesHandler } from './query-handlers/get-average-reliabilities.handler';
import { GetLatestBestPredictionHandler } from './query-handlers/get-latest-best-prediction.handler';
import { GetUpcomingPredictionCountsHandler } from './query-handlers/get-upcoming-prediction-counts.handler';
import { GetAlgorithmReliabilityHistoryHandler } from './query-handlers/get-algorithm-reliability-history.handler';
import { GetEpisodeBestPredictionHandler } from './query-handlers/get-episode-best-prediction.handler';
import { PredictionGeneratedHandler } from './event-handlers/prediction-generated.handler';
import { GetAlgorithmTypeHandler } from './query-handlers/get-algorithm-type.handler';
import { FetchAlgorithmHandler } from './command-handlers/fetch-algorithm.hanlder';
import { UpdateAlgorithmHandler } from './command-handlers/update-algorithm.handler';
import { AlgorithmFetchedHandler } from './event-handlers/algorithm-fetched.handler';
import { PredictionAnalyzedHandler } from './event-handlers/prediction-analyzed.handler';
import { AnalysisCreatedHandler } from './event-handlers/analysis-created.handler';

export const CommandHandlers = [
  SetPersonalWeightHandler,
  GeneratePredictionHandler,
  AnalyzeHandler,
  FetchAlgorithmHandler,
  UpdateAlgorithmHandler,
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
  GetAlgorithmTypeHandler,
];

export const EventHandlers = [
  PredictionGeneratedHandler,
  AlgorithmFetchedHandler,
  PredictionAnalyzedHandler,
  AnalysisCreatedHandler,
];
