import { AggregateRoot } from '@nestjs/cqrs';
import { LottoNumberSet } from '../vos/lotto-number-set.vo';
import { WinningNumberDrawnEvent } from '../events/winning-number-drawn.event';

export class DomainWinningNumber extends AggregateRoot {
  public readonly episode: number;
  public numberSet: LottoNumberSet;
  public isDrawn: boolean;

  constructor(episode: number, numbers: number[], isDrawn: boolean) {
    super();
    this.episode = episode;
    this.numberSet = new LottoNumberSet(numbers);
    this.isDrawn = isDrawn;
  }

  draw(numbers: number[]): void {
    if (this.isDrawn) throw new Error('Already drawn episode');
    this.numberSet = new LottoNumberSet(numbers);
    this.isDrawn = true;
    this.apply(new WinningNumberDrawnEvent(this.episode, numbers));
  }

  getNumberArray(): number[] {
    return this.numberSet.toValues();
  }
}
