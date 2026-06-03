import { DomainWinningNumber } from '../aggregates/winning-number.entity';

export class WinningNumberDrawer {
  static drawPlaceholder(episode: number): DomainWinningNumber {
    return new DomainWinningNumber(episode, [0, 0, 0, 0, 0, 0, 0], false);
  }
}
