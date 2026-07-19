export class SavePersonalPredictionCommand {
  constructor(
    public readonly userId: string,
    public readonly episode: number,
    public readonly prediction: number[],
  ) {}
}
