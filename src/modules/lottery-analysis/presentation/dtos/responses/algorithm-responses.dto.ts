import { Expose } from 'class-transformer';

export class AlgorithmResponsesDto {
  @Expose()
  type: string;

  @Expose()
  complexity: number;

  @Expose()
  name?: string;

  @Expose()
  description?: string;
}
