export class GetPersonalWeightQuery {
  constructor(
    public readonly visitorId: string,
    public readonly algorithm: string,
  ) {}
}
