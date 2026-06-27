export class LottoNumber {
  readonly value: number;

  constructor(value: number) {
    if (value < 0 || value > 45)
      throw new Error('Value must be between 0 and 45');
    this.value = value;
  }
}
