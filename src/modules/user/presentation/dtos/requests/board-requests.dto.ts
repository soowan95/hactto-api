import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { BoardCategory } from '../../../../../generated/prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePostDto {
  @IsEnum(BoardCategory)
  @IsNotEmpty()
  category: BoardCategory;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Lotto rank (only for WINNING)' })
  @IsOptional()
  @IsNumber()
  lottoRank?: number;

  @ApiPropertyOptional({ description: 'Lotto round (only for WINNING)' })
  @IsOptional()
  @IsNumber()
  lottoRound?: number;
}

export class ReportPostDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
