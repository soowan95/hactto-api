import { SetPersonalWeightHandler } from './command-handlers/set-personal-weight.handler';
import { GeneratePredictionHandler } from './command-handlers/generate-prediction.handler';
import { AnalyzeReliabilityHandler } from './command-handlers/analyze-reliability.handler';
import { GetPredictionHistoryHandler } from './query-handlers/get-prediction-history.handler';
import { GetPersonalWeightHandler } from './query-handlers/get-personal-weight.handler';
import { GetAverageReliabilityHandler } from './query-handlers/get-average-reliability.handler';
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
];

export const EventHandlers = [
  PredictionGeneratedHandler,
  PredictionReliabilityCalculatedHandler,
];
