export class WinningNumberDrawnEvent {
  constructor(
    public readonly episode: number,
    public readonly numbers: number[],
  ) {}
}
