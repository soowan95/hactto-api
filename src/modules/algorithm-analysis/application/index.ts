import { SetPersonalWeightHandler } from './commands/set-personal-weight/set-personal-weight.handler';
import { GeneratePredictionHandler } from './commands/generate-prediction/generate-prediction.handler';
import { AnalyzeReliabilityHandler } from './commands/analyze-reliability/analyze-reliability.handler';
import { GetPredictionHistoryHandler } from './queries/get-prediction-history/get-prediction-history.handler';
import { GetPersonalWeightHandler } from './queries/get-personal-weight/get-personal-weight.handler';
import { GetAverageReliabilityHandler } from './queries/get-average-reliability/get-average-reliability.handler';

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
