import { AlgorithmType } from '@hactto/algorithm';
import { Weights } from '../vos/weights.vo';

export class DomainPersonalWeight {
  public id?: number;
  public readonly visitorId: string;
  public readonly algorithm: AlgorithmType;
  public readonly weights: Weights;

  constructor(
    visitorId: string,
    algorithm: AlgorithmType,
    weights: number[],
    id?: number,
  ) {
    this.visitorId = visitorId;
    this.algorithm = algorithm;
    this.weights = new Weights(weights);
    this.id = id;
  }

  getWeightsArray(): number[] {
    return this.weights.toValues();
  }
}
