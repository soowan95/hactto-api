import { ReliabilityScore } from '../vos/reliability-score.vo';

export class DomainAnalysis {
  public readonly id?: number;
  public reliability: ReliabilityScore;
  public readonly even: number;
  public readonly odd: number;
  public readonly hot: number;
  public readonly warm: number;
  public readonly cold: number;
  public readonly low: number;
  public readonly high: number;
  public readonly ac: number;
  public readonly consecutive: number[][];

  constructor(
    reliability: number,
    even: number,
    odd: number,
    hot: number,
    warm: number,
    cold: number,
    low: number,
    high: number,
    ac: number,
    consecutive: number[][],
    id?: number,
  ) {
    this.reliability = new ReliabilityScore(reliability);
    this.even = even;
    this.odd = odd;
    this.hot = hot;
    this.warm = warm;
    this.cold = cold;
    this.low = low;
    this.high = high;
    this.ac = ac;
    this.consecutive = consecutive;
    this.id = id;
  }

  static create(
    prediction: number[],
    temperatures?: Record<number, 'HOT' | 'WARM' | 'COLD'>,
  ): DomainAnalysis {
    const { even, odd } = this.countEvenOdd(prediction);
    const { low, high } = this.countLowHigh(prediction);
    const ac = this.calculateArithmeticComplexity(prediction);
    const consecutive = this.getConsecutiveNumbers(prediction);

    let hot = 0;
    let warm = 0;
    let cold = 0;

    if (temperatures) {
      for (const ball of prediction) {
        const temp = temperatures[ball];
        if (temp === 'HOT') hot++;
        else if (temp === 'WARM') warm++;
        else if (temp === 'COLD') cold++;
      }
    }

    return new DomainAnalysis(
      0,
      even.length,
      odd.length,
      hot,
      warm,
      cold,
      low.length,
      high.length,
      ac,
      consecutive,
    );
  }

  static dummy() {
    return {
      id: 0,
      reliability: 0,
      even: 0,
      odd: 0,
      hot: 0,
      warm: 0,
      cold: 0,
      low: 0,
      high: 0,
      ac: 0,
      consecutive: '{}',
    };
  }

  setReliability(score: number) {
    this.reliability = new ReliabilityScore(score);
  }

  getReliability() {
    return this.reliability.getScore();
  }

  private static countEvenOdd(prediction: number[]) {
    const even = prediction.filter((n) => n % 2 === 0);
    const odd = prediction.filter((n) => n % 2 !== 0);
    return { even, odd };
  }

  private static countLowHigh(prediction: number[]) {
    const low = prediction.filter((n) => n < 23);
    const high = prediction.filter((n) => n >= 23);
    return { low, high };
  }

  private static calculateArithmeticComplexity(prediction: number[]) {
    const numSet = new Set<number>();
    for (let i = 0; i < prediction.length - 1; i++) {
      for (let j = i + 1; j < prediction.length; j++) {
        numSet.add(prediction[j] - prediction[i]);
      }
    }
    return numSet.size;
  }

  private static getConsecutiveNumbers(prediction: number[]) {
    const consecutiveNumbers: number[][] = [];
    const consecutiveNumberSet = new Set<number>();
    for (let i = 0; i < prediction.length - 1; i++) {
      if (prediction[i + 1] - prediction[i] === 1) {
        consecutiveNumberSet.add(prediction[i]);
        consecutiveNumberSet.add(prediction[i + 1]);
      } else {
        if (consecutiveNumberSet.size > 1) {
          consecutiveNumbers.push([...consecutiveNumberSet]);
          consecutiveNumberSet.clear();
        }
      }
    }

    if (consecutiveNumberSet.size > 1) {
      consecutiveNumbers.push([...consecutiveNumberSet]);
    }
    return consecutiveNumbers;
  }
}
