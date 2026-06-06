export class UpdateAlgorithmCommand {
  constructor(
    public readonly type: string,
    public readonly complexity?: number,
    public readonly name?: string,
    public readonly description?: string,
  ) {}
}
