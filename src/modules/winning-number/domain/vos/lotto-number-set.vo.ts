import { LottoNumber } from './lotto-number.vo';

export class LottoNumberSet {
  readonly numbers: LottoNumber[];

  constructor(numbers: number[]) {
    if (numbers.length !== 7) throw new Error('Numbers must be 7');
    this.numbers = numbers.map((n) => new LottoNumber(n));
  }

  toValues(): number[] {
    return this.numbers.map((n) => n.value);
  }

  isNonZero(): boolean {
    const mainNumberSet = this.toValues().slice(0, 6);
    return mainNumberSet.every((n) => n !== 0);
  }
}
