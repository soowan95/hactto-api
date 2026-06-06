export class SavePersonalPredictionCommand {
  constructor(
    public readonly visitorId: string,
    public readonly episode: number,
    public readonly prediction: number[],
  ) {}
}
