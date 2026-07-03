import { IsString, IsNotEmpty, IsIn, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendNotificationDto {
  @ApiProperty({ description: 'Target type', enum: ['VISITOR_ID', 'NICKNAME'] })
  @IsString()
  @IsIn(['VISITOR_ID', 'NICKNAME'])
  targetType: 'VISITOR_ID' | 'NICKNAME';

  @ApiProperty({ description: 'Visitor ID or Nickname' })
  @IsString()
  @IsNotEmpty()
  target: string;

  @ApiProperty({ description: 'Notification title' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @ApiProperty({ description: 'Notification content' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
