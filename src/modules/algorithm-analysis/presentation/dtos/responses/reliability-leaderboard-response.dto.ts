import { AlgorithmType } from '@hactto/algorithm';
import { ApiProperty } from '@nestjs/swagger';

export class ReliabilityLeaderboardResponseDto {
  @ApiProperty({
    enum: AlgorithmType,
  })
  algorithm: AlgorithmType;

  @ApiProperty({
    example: 85.5,
  })
  average: number;
}
