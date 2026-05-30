import { AlgorithmType } from '@hactto/algorithm';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class SetPersonalWeightRequestDto {
  @ApiProperty({ description: '방문자 식별자' })
  @IsString()
  @IsNotEmpty()
  visitorId: string;

  @ApiProperty({ description: '알고리즘 타입', enum: AlgorithmType })
  @IsEnum(AlgorithmType)
  @IsNotEmpty()
  algorithm: AlgorithmType;

  @ApiProperty({
    description: '7개의 가중치 숫자 배열 (합이 100이어야 함)',
    type: [Number],
  })
  @IsArray()
  @IsNotEmpty()
  weights: number[];
}
