import { ApiProperty } from '@nestjs/swagger';

export class ReliabilityAverageResponseDto {
  @ApiProperty()
  type: string;

  @ApiProperty({
    example: 30,
  })
  average: number;
}
