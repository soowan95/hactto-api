import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty } from 'class-validator';

export class GeneratePredictionRequestDto {
  @ApiProperty({
    description: '7개의 가중치 숫자 배열 (합이 100이어야 함)',
    type: [Number],
  })
  @IsArray()
  @IsNotEmpty()
  weights: number[];
}
