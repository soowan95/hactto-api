export class SetPersonalWeightCommand {
  constructor(
    public readonly visitorId: string,
    public readonly algorithm: string,
    public readonly weights: number[],
  ) {}
}
