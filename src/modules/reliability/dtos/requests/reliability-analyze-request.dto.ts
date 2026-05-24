import { ApiPropertyOptional } from '@nestjs/swagger';
import { AlgorithmType } from '@hactto/algorithm';
import { IsEnum, IsOptional } from 'class-validator';

export class ReliabilityAnalyzeRequestDto {
  @ApiPropertyOptional({ enum: AlgorithmType })
  @IsOptional()
  @IsEnum(AlgorithmType, {
    message:
      't must be one of the following values: ' +
      Object.values(AlgorithmType).join(', '),
  })
  t?: AlgorithmType;
}
