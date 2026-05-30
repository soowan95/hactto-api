export class Weights {
  private readonly values: number[];

  constructor(weights: number[]) {
    if (weights.length !== 7) {
      throw new Error('Weights must contain exactly 7 values.');
    }
    if (weights.some((w) => w < 0)) {
      throw new Error('Weights must be non-negative values.');
    }
    const sum = weights.reduce((acc, cur) => acc + cur, 0);
    if (sum !== 100) {
      throw new Error('The sum of weights must be exactly 100.');
    }
    this.values = [...weights];
  }

  toValues(): number[] {
    return [...this.values];
  }
}
