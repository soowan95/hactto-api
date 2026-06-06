import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber } from 'class-validator';

export class SavePersonalPredictionRequestDto {
  @ApiProperty({ description: '예측 회차' })
  @IsNumber()
  episode: number;

  @ApiProperty({ description: '예측 번호 6개', type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  prediction: number[];
}
