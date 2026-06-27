import { ApiProperty } from '@nestjs/swagger';

export class ReliabilityLeaderboardResponseDto {
  @ApiProperty()
  algorithm: string;

  @ApiProperty({
    example: 85.5,
  })
  average: number;
}
