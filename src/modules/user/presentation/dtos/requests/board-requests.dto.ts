import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BoardCategory } from '../../../../../generated/prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PostAttachmentDto {
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @IsString()
  @IsOptional()
  originalFileName?: string;
}

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

  @IsString()
  @IsOptional()
  originalFileName?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PostAttachmentDto)
  attachments?: PostAttachmentDto[];

  @ApiPropertyOptional({ description: 'Lotto rank (only for WINNING)' })
  @IsOptional()
  @IsNumber()
  lottoRank?: number;

  @ApiPropertyOptional({ description: 'Lotto round (only for WINNING)' })
  @IsOptional()
  @IsNumber()
  lottoRound?: number;

  @ApiPropertyOptional({
    description: 'Lotto identifier from QR code (only for WINNING)',
  })
  @IsOptional()
  @IsString()
  lottoIdentifier?: string;
}

export class ReportPostDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
