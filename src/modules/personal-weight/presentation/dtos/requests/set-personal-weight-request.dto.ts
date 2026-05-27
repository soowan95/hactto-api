import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsString,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { AlgorithmType } from '@hactto/algorithm';

export class SetPersonalWeightRequestDto {
  @ApiProperty({ description: '이용자 식별 아이디' })
  @IsString()
  visitorId: string;

  @ApiProperty({ description: '알고리즘 타입', enum: AlgorithmType })
  @IsEnum(AlgorithmType)
  algorithm: AlgorithmType;

  @ApiProperty({ description: '가중치 배열 (7개, 총합 100)', type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  @ArrayMinSize(7)
  @ArrayMaxSize(7)
  weights: number[];
}
