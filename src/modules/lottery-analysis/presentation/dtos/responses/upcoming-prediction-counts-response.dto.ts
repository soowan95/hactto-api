import { ApiProperty } from '@nestjs/swagger';

export class UpcomingPredictionCountsResponseDto {
  @ApiProperty()
  algorithm: string;

  @ApiProperty({ example: 10 })
  count: number;
}
