export class SetPersonalWeightCommand {
  constructor(
    public readonly userId: string,
    public readonly algorithm: string,
    public readonly weights: number[],
  ) {}
}
