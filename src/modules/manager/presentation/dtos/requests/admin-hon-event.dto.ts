import {
  IsEnum,
  IsInt,
  IsOptional,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AdminHonEventType {
  RESET = 'RESET',
  ADD = 'ADD',
}

export class CreateAdminHonEventDto {
  @ApiProperty({
    enum: AdminHonEventType,
    description:
      '이벤트 타입 (RESET: 지정 개수로 초기화, ADD: 지정 개수만큼 추가)',
  })
  @IsEnum(AdminHonEventType)
  type: AdminHonEventType;

  @ApiProperty({ description: '초기화 또는 추가할 HON 개수' })
  @IsInt()
  amount: number;

  @ApiProperty({ description: '이벤트 시작일시 (ISO 8601)' })
  @IsDateString()
  startsAt: string;

  @ApiPropertyOptional({
    description: '이벤트 종료일시 (ISO 8601). 값이 없으면 영구 이벤트',
  })
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiPropertyOptional({ description: '이벤트 활성화 여부', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
