import { IWinningNumberRepository } from '../modules/number/domain/ports/winning-number.port';
import { PairCount } from '../modules/user/domain/vos/pair-count.vo';

export class LotteryAnalyzer {
  static async countPair(
    repository: IWinningNumberRepository,
    prediction: number[],
  ): Promise<PairCount[]> {
    const result: PairCount[] = [];
    for (let i = 0; i < prediction.length - 1; i++) {
      for (let j = i + 1; j < prediction.length; j++) {
        const pair: [number, number] = [prediction[i], prediction[j]];
        const count = await repository.countByPair(pair);
        result.push({ pair, count });
      }
    }
    return result;
  }

  static countPrime(prediction: number[]) {
    return prediction.filter((n) => {
      if (n <= 1) return false;
      for (let i = 2; i <= Math.sqrt(n); i++) {
        if (n % i === 0) return false;
      }
      return true;
    }).length;
  }

  static countByMultiOfThree(prediction: number[]) {
    return prediction.filter((n) => (n !== 3 && n % 3) === 0).length;
  }

  static countByMultiOfTen(prediction: number[], multi: number) {
    return prediction.filter((n) => Math.floor(n / 10) === multi).length;
  }

  static sumOfLastDigits(prediction: number[]) {
    return prediction.reduce((sum, n) => sum + (n % 10), 0);
  }

  static getLastDigitGroup(prediction: number[], group: number) {
    return prediction.filter((n) => n % 10 === group);
  }

  static countEvenOdd(prediction: number[]) {
    const even = prediction.filter((n) => n % 2 === 0);
    const odd = prediction.filter((n) => n % 2 !== 0);
    return { even, odd };
  }

  static countLowHigh(prediction: number[]) {
    const low = prediction.filter((n) => n < 23);
    const high = prediction.filter((n) => n >= 23);
    return { low, high };
  }

  static calculateArithmeticComplexity(prediction: number[]) {
    const numSet = new Set<number>();
    for (let i = 0; i < prediction.length - 1; i++) {
      for (let j = i + 1; j < prediction.length; j++) {
        numSet.add(prediction[j] - prediction[i]);
      }
    }
    return numSet.size;
  }

  static getConsecutiveNumbers(prediction: number[]) {
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

  static async countByRank(
    repository: IWinningNumberRepository,
    prediction: number[],
    rank: number,
  ) {
    const winningNumbers = await repository.findAll({
      where: { isDrawn: true },
    });

    const predSet = new Set(prediction);
    let count = 0;

    for (const wn of winningNumbers) {
      const numbers = wn.getNumberArray();
      const mainNums = numbers.slice(0, 6);
      const bonusNum = numbers[6];

      const matchCount = mainNums.filter((n) => predSet.has(n)).length;
      const bonusMatch = predSet.has(bonusNum);

      let currentRank = 0;
      if (matchCount === 6) currentRank = 1;
      else if (matchCount === 5 && bonusMatch) currentRank = 2;
      else if (matchCount === 5) currentRank = 3;
      else if (matchCount === 4) currentRank = 4;
      else if (matchCount === 3) currentRank = 5;
      if (currentRank === rank) {
        count++;
      }
    }

    return count;
  }
}
