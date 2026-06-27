export class AnalysisWinningNumber {
  constructor(
    public readonly episode: number,
    public readonly numbers: number[],
    public readonly isDrawn: boolean,
    public readonly analysis?: any,
  ) {}
}
