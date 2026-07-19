export class DomainPersonalPrediction {
  public readonly id?: number;
  public readonly userId: string;
  public readonly episode: number;
  public readonly numbers: number[];

  constructor(userId: string, episode: number, numbers: number[], id?: number) {
    this.id = id;
    this.userId = userId;
    this.episode = episode;
    this.numbers = numbers;
  }
}
