export class GetPersonalWeightQuery {
  constructor(
    public readonly userId: string,
    public readonly algorithm: string,
  ) {}
}
