import { ReliabilityScore } from '../vos/reliability-score.vo';

export class DomainAnalysis {
  public readonly id?: number;
  public reliability: ReliabilityScore;
  public readonly sum: number;
  public readonly cnt0s: number;
  public readonly cnt10s: number;
  public readonly cnt20s: number;
  public readonly cnt30s: number;
  public readonly cnt40s: number;
  public readonly sumLastDigits: number;
  public readonly lastDigit0: string;
  public readonly lastDigit1: string;
  public readonly lastDigit2: string;
  public readonly lastDigit3: string;
  public readonly lastDigit4: string;
  public readonly lastDigit5: string;
  public readonly lastDigit6: string;
  public readonly lastDigit7: string;
  public readonly lastDigit8: string;
  public readonly lastDigit9: string;
  public readonly even: number;
  public readonly odd: number;
  public readonly hot: number;
  public readonly warm: number;
  public readonly cold: number;
  public readonly low: number;
  public readonly high: number;
  public readonly ac: number;
  public readonly consecutive: number[][];
  public temperatures?: Record<number, 'HOT' | 'WARM' | 'COLD'>;

  constructor(
    reliability: number,
    sum: number,
    cnt0s: number,
    cnt10s: number,
    cnt20s: number,
    cnt30s: number,
    cnt40s: number,
    sumLastDigits: number,
    lastDigit0: number[],
    lastDigit1: number[],
    lastDigit2: number[],
    lastDigit3: number[],
    lastDigit4: number[],
    lastDigit5: number[],
    lastDigit6: number[],
    lastDigit7: number[],
    lastDigit8: number[],
    lastDigit9: number[],
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
    this.sum = sum;
    this.cnt0s = cnt0s;
    this.cnt10s = cnt10s;
    this.cnt20s = cnt20s;
    this.cnt30s = cnt30s;
    this.cnt40s = cnt40s;
    this.sumLastDigits = sumLastDigits;
    this.lastDigit0 = JSON.stringify(lastDigit0);
    this.lastDigit1 = JSON.stringify(lastDigit1);
    this.lastDigit2 = JSON.stringify(lastDigit2);
    this.lastDigit3 = JSON.stringify(lastDigit3);
    this.lastDigit4 = JSON.stringify(lastDigit4);
    this.lastDigit5 = JSON.stringify(lastDigit5);
    this.lastDigit6 = JSON.stringify(lastDigit6);
    this.lastDigit7 = JSON.stringify(lastDigit7);
    this.lastDigit8 = JSON.stringify(lastDigit8);
    this.lastDigit9 = JSON.stringify(lastDigit9);
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
    if (prediction.length === 7) prediction = prediction.slice(0, 6);
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

    const analysis = new DomainAnalysis(
      0,
      prediction.reduce((a, b) => a + b, 0),
      this.countByMultiOfTen(prediction, 0),
      this.countByMultiOfTen(prediction, 1),
      this.countByMultiOfTen(prediction, 2),
      this.countByMultiOfTen(prediction, 3),
      this.countByMultiOfTen(prediction, 4),
      this.sumOfLastDigits(prediction),
      this.getLastDigitGroup(prediction, 0),
      this.getLastDigitGroup(prediction, 1),
      this.getLastDigitGroup(prediction, 2),
      this.getLastDigitGroup(prediction, 3),
      this.getLastDigitGroup(prediction, 4),
      this.getLastDigitGroup(prediction, 5),
      this.getLastDigitGroup(prediction, 6),
      this.getLastDigitGroup(prediction, 7),
      this.getLastDigitGroup(prediction, 8),
      this.getLastDigitGroup(prediction, 9),
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
    analysis.temperatures = temperatures;
    return analysis;
  }

  static dummy() {
    return {
      id: 0,
      reliability: 0,
      sum: 0,
      cnt0s: 0,
      cnt10s: 0,
      cnt20s: 0,
      cnt30s: 0,
      cnt40s: 0,
      sumLastDigits: 0,
      lastDigit0: '{}',
      lastDigit1: '{}',
      lastDigit2: '{}',
      lastDigit3: '{}',
      lastDigit4: '{}',
      lastDigit5: '{}',
      lastDigit6: '{}',
      lastDigit7: '{}',
      lastDigit8: '{}',
      lastDigit9: '{}',
      even: 0,
      odd: 0,
      hot: 0,
      warm: 0,
      cold: 0,
      low: 0,
      high: 0,
      ac: 0,
      consecutive: '{}',
      createdAt: new Date(),
    };
  }

  setReliability(score: number) {
    this.reliability = new ReliabilityScore(score);
  }

  getReliability() {
    return this.reliability.getScore();
  }

  private static countByMultiOfTen(prediction: number[], multi: number) {
    return prediction.filter((n) => Math.floor(n / 10) === multi).length;
  }

  private static sumOfLastDigits(prediction: number[]) {
    return prediction.reduce((sum, n) => sum + (n % 10), 0);
  }

  private static getLastDigitGroup(prediction: number[], group: number) {
    return prediction.filter((n) => n % 10 === group);
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
