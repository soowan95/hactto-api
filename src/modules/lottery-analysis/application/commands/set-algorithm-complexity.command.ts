export class SetAlgorithmComplexityCommand {
  constructor(
    public readonly type: string,
    public readonly complexity: number,
  ) {}
}
