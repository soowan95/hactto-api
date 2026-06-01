import { ApiProperty } from '@nestjs/swagger';

export class PredictionDetailDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty()
  algorithm: string;

  @ApiProperty({ example: 1120 })
  episode: number;

  @ApiProperty({ example: [25, 20, 15, 15, 10, 10, 5] })
  weights: number[];

  @ApiProperty({ example: [4, 12, 18, 29, 32, 45, 9] })
  numbers: number[];

  @ApiProperty({ example: 88.5 })
  reliabilityScore: number;
}

export class WinningNumberDetailDto {
  @ApiProperty({ example: 1120 })
  episode: number;

  @ApiProperty({ example: [4, 11, 18, 28, 32, 44, 8] })
  numbers: number[];
}

export class LatestBestPredictionResponseDto {
  @ApiProperty({ type: PredictionDetailDto })
  prediction: PredictionDetailDto;

  @ApiProperty({ type: WinningNumberDetailDto })
  winningNumber: WinningNumberDetailDto;
}
