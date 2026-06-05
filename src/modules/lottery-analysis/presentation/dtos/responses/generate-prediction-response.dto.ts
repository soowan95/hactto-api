import { ApiProperty } from '@nestjs/swagger';

export class GeneratePredictionResponseDto {
  @ApiProperty({ example: [4, 12, 18, 29, 32, 45] })
  numbers: number[];

  @ApiProperty({ required: false })
  analysis?: any;
}
