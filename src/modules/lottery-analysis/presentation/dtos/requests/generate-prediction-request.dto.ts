import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional } from 'class-validator';

export class GeneratePredictionRequestDto {
  @ApiProperty({
    description: '6개의 가중치 숫자 배열 (합이 100이어야 함)',
    type: [Number],
    required: false,
  })
  @IsArray()
  @IsOptional()
  weights?: number[];

  @ApiProperty({
    description: '생성할 예측번호의 홀수 갯수',
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  oddCount?: number;
}
