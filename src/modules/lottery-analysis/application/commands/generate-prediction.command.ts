export class GeneratePredictionCommand {
  constructor(
    public readonly type: string,
    public readonly visitorId?: string,
    public readonly weights?: number[],
  ) {}
}
