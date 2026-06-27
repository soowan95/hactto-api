import { ApiProperty } from '@nestjs/swagger';

export class AlgorithmReliabilityHistoryResponseDto {
  @ApiProperty({ example: 1118 })
  episode: number;

  @ApiProperty({ example: 78.5 })
  averageScore: number;
}
