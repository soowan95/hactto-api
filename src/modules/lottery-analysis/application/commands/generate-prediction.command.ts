export class GeneratePredictionCommand {
  constructor(
    public readonly type: string,
    public readonly userId?: string,
    public readonly weights?: number[],
    public readonly oddCount?: number,
  ) {}
}
