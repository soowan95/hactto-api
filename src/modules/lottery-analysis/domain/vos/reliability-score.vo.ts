export class ReliabilityScore {
  readonly score: number;

  constructor(score: number) {
    if (score < -1 || score > 100) throw new Error('Invalid reliability score');
    this.score = score;
  }

  getScore() {
    return this.score;
  }
}
