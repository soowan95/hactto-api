import { LotteryAnalyzer } from '../../../../libs/lottery-analyzer';
import { IWinningNumberRepository } from '../../../number/domain/ports/winning-number.port';
import { PairCount } from '../vos/pair-count.vo';

export class DomainPersonalAnalysis {
  public readonly id: number;
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
  public readonly pair: PairCount[];
  public readonly prime: number;
  public readonly composite: number;
  public readonly mul3: number;
  public readonly win1: number;
  public readonly win2: number;
  public readonly win3: number;
  public readonly win4: number;
  public readonly win5: number;
  public readonly temperatures?: Record<number, 'HOT' | 'WARM' | 'COLD'>;

  constructor(
    id: number,
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
    pair: PairCount[],
    prime: number,
    composite: number,
    mul3: number,
    win1: number,
    win2: number,
    win3: number,
    win4: number,
    win5: number,
    temperatures?: Record<number, 'HOT' | 'WARM' | 'COLD'>,
  ) {
    this.id = id;
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
    this.pair = pair;
    this.prime = prime;
    this.composite = composite;
    this.mul3 = mul3;
    this.win1 = win1;
    this.win2 = win2;
    this.win3 = win3;
    this.win4 = win4;
    this.win5 = win5;
    this.temperatures = temperatures;
  }

  static async create(
    repository: IWinningNumberRepository,
    id: number,
    personalPrediction: number[],
    temperatures?: Record<number, 'HOT' | 'WARM' | 'COLD'>,
  ): Promise<DomainPersonalAnalysis> {
    const { even, odd } = LotteryAnalyzer.countEvenOdd(personalPrediction);
    const { low, high } = LotteryAnalyzer.countLowHigh(personalPrediction);
    const ac =
      LotteryAnalyzer.calculateArithmeticComplexity(personalPrediction);
    const consecutive =
      LotteryAnalyzer.getConsecutiveNumbers(personalPrediction);
    const pair = await LotteryAnalyzer.countPair(
      repository,
      personalPrediction,
    );

    let hot = 0;
    let warm = 0;
    let cold = 0;

    if (temperatures) {
      for (const ball of personalPrediction) {
        const temp = temperatures[ball];
        if (temp === 'HOT') hot++;
        else if (temp === 'WARM') warm++;
        else if (temp === 'COLD') cold++;
      }
    }

    const prime = LotteryAnalyzer.countPrime(personalPrediction);
    const mul3 = LotteryAnalyzer.countByMultiOfThree(personalPrediction);
    const composite = 6 - prime - mul3;

    return new DomainPersonalAnalysis(
      id,
      personalPrediction.reduce((a, b) => a + b, 0),
      LotteryAnalyzer.countByMultiOfTen(personalPrediction, 0),
      LotteryAnalyzer.countByMultiOfTen(personalPrediction, 1),
      LotteryAnalyzer.countByMultiOfTen(personalPrediction, 2),
      LotteryAnalyzer.countByMultiOfTen(personalPrediction, 3),
      LotteryAnalyzer.countByMultiOfTen(personalPrediction, 4),
      LotteryAnalyzer.sumOfLastDigits(personalPrediction),
      LotteryAnalyzer.getLastDigitGroup(personalPrediction, 0),
      LotteryAnalyzer.getLastDigitGroup(personalPrediction, 1),
      LotteryAnalyzer.getLastDigitGroup(personalPrediction, 2),
      LotteryAnalyzer.getLastDigitGroup(personalPrediction, 3),
      LotteryAnalyzer.getLastDigitGroup(personalPrediction, 4),
      LotteryAnalyzer.getLastDigitGroup(personalPrediction, 5),
      LotteryAnalyzer.getLastDigitGroup(personalPrediction, 6),
      LotteryAnalyzer.getLastDigitGroup(personalPrediction, 7),
      LotteryAnalyzer.getLastDigitGroup(personalPrediction, 8),
      LotteryAnalyzer.getLastDigitGroup(personalPrediction, 9),
      even.length,
      odd.length,
      hot,
      warm,
      cold,
      low.length,
      high.length,
      ac,
      consecutive,
      pair,
      prime,
      composite,
      mul3,
      await LotteryAnalyzer.countByRank(repository, personalPrediction, 1),
      await LotteryAnalyzer.countByRank(repository, personalPrediction, 2),
      await LotteryAnalyzer.countByRank(repository, personalPrediction, 3),
      await LotteryAnalyzer.countByRank(repository, personalPrediction, 4),
      await LotteryAnalyzer.countByRank(repository, personalPrediction, 5),
      temperatures,
    );
  }
}
