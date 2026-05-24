import { AlgorithmType } from '@hactto/algorithm';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class GenerateWinningNumberRequestDto {
  @ApiProperty({
    enum: AlgorithmType,
  })
  @IsEnum(AlgorithmType)
  @IsNotEmpty()
  t: AlgorithmType;
}
