import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional } from 'class-validator';

export class GeneratePredictionRequestDto {
  @ApiProperty({
    description: '6개의 가중치 숫자 배열 (합이 100이어야 함)',
    type: [Number],
    required: false,
  })
  @IsArray()
  @IsOptional()
  weights?: number[];
}
