import { AnalyzePersonalPredictionHandler } from './command-handler/analyze-personal-prediction.handler';
import { SavePersonalPredictionHandler } from './command-handler/save-personal-prediction.handler';
import { GetPersonalPredictionHistoryHandler } from './query-handlers/get-personal-prediction-history.handler';

export const CommandHandlers = [
  AnalyzePersonalPredictionHandler,
  SavePersonalPredictionHandler,
];

export const QueryHandlers = [GetPersonalPredictionHistoryHandler];
