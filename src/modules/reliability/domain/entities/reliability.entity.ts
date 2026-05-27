import { ReliabilityScore } from '../vos/reliability-score.vo';

export class DomainReliability {
  public readonly id: number;
  public readonly score: ReliabilityScore;

  constructor(id: number, score: number) {
    this.id = id;
    this.score = new ReliabilityScore(score);
  }
}
