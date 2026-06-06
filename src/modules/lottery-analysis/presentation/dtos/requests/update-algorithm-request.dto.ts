import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateAlgorithmRequestDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  complexity?: number;

  @IsString()
  @IsOptional()
  description?: string;
}
