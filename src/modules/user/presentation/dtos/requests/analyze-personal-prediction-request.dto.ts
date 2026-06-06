import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber } from 'class-validator';

export class AnalyzePersonalPredictionRequestDto {
  @ApiProperty({
    description: '분석할 6개 번호 배열',
    type: [Number],
    required: true,
  })
  @IsArray()
  @IsNumber({}, { each: true })
  prediction: number[];
}
