import { AlgorithmType } from '@hactto/algorithm';

export class GetEpisodeBestPredictionQuery {
  constructor(
    public readonly episode: number,
    public readonly algorithm: AlgorithmType,
  ) {}
}
