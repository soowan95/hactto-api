import { LottoNumberSet } from '../vos/lotto-number-set.vo';

export class DomainWinningNumber {
  public readonly episode: number;
  public numberSet: LottoNumberSet;
  public isDrawn: boolean;

  constructor(episode: number, numbers: number[], isDrawn: boolean) {
    this.episode = episode;
    this.numberSet = new LottoNumberSet(numbers);
    this.isDrawn = isDrawn;
  }

  draw(numbers: number[]): void {
    if (this.isDrawn) throw new Error('Already drawn episode');
    this.numberSet = new LottoNumberSet(numbers);
    this.isDrawn = true;
  }

  getNumberArray(): number[] {
    return this.numberSet.toValues();
  }
}
