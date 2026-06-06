export class DomainPersonalPrediction {
  public readonly id?: number;
  public readonly visitorId: string;
  public readonly episode: number;
  public readonly numbers: number[];

  constructor(
    visitorId: string,
    episode: number,
    numbers: number[],
    id?: number,
  ) {
    this.id = id;
    this.visitorId = visitorId;
    this.episode = episode;
    this.numbers = numbers;
  }
}
