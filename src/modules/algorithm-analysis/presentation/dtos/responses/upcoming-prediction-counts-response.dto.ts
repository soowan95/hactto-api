import { AlgorithmType } from '@hactto/algorithm';
import { ApiProperty } from '@nestjs/swagger';

export class UpcomingPredictionCountsResponseDto {
  @ApiProperty({ enum: AlgorithmType })
  algorithm: AlgorithmType;

  @ApiProperty({ example: 10 })
  count: number;
}
