import { ReliabilityScore } from '../vos/reliability-score.vo';
import { LotteryAnalyzer } from '../../../../libs/lottery-analyzer';

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
    const { even, odd } = LotteryAnalyzer.countEvenOdd(prediction);
    const { low, high } = LotteryAnalyzer.countLowHigh(prediction);
    const ac = LotteryAnalyzer.calculateArithmeticComplexity(prediction);
    const consecutive = LotteryAnalyzer.getConsecutiveNumbers(prediction);

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
      prediction.reduce((a, b) => a + b, 0),
      LotteryAnalyzer.countByMultiOfTen(prediction, 0),
      LotteryAnalyzer.countByMultiOfTen(prediction, 1),
      LotteryAnalyzer.countByMultiOfTen(prediction, 2),
      LotteryAnalyzer.countByMultiOfTen(prediction, 3),
      LotteryAnalyzer.countByMultiOfTen(prediction, 4),
      LotteryAnalyzer.sumOfLastDigits(prediction),
      LotteryAnalyzer.getLastDigitGroup(prediction, 0),
      LotteryAnalyzer.getLastDigitGroup(prediction, 1),
      LotteryAnalyzer.getLastDigitGroup(prediction, 2),
      LotteryAnalyzer.getLastDigitGroup(prediction, 3),
      LotteryAnalyzer.getLastDigitGroup(prediction, 4),
      LotteryAnalyzer.getLastDigitGroup(prediction, 5),
      LotteryAnalyzer.getLastDigitGroup(prediction, 6),
      LotteryAnalyzer.getLastDigitGroup(prediction, 7),
      LotteryAnalyzer.getLastDigitGroup(prediction, 8),
      LotteryAnalyzer.getLastDigitGroup(prediction, 9),
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
}
