import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class SetPersonalWeightRequestDto {
  @ApiProperty({ description: '방문자 식별자' })
  @IsString()
  @IsNotEmpty()
  visitorId: string;

  @ApiProperty({ description: '알고리즘 타입' })
  @IsNotEmpty()
  algorithm: string;

  @ApiProperty({
    description: '6개의 가중치 숫자 배열 (합이 100이어야 함)',
    type: [Number],
  })
  @IsArray()
  @IsNotEmpty()
  weights: number[];
}
