import { AlgorithmType } from '@hactto/algorithm';
import { ApiProperty } from '@nestjs/swagger';

export class ReliabilityAverageResponseDto {
  @ApiProperty({
    enum: AlgorithmType,
  })
  type: AlgorithmType;

  @ApiProperty({
    example: 30,
  })
  average: number;
}
