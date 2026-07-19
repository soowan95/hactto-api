import { IsString, IsNotEmpty, IsIn, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendNotificationDto {
  @ApiProperty({ description: 'Target type', enum: ['USER_ID', 'NICKNAME'] })
  @IsString()
  @IsIn(['USER_ID', 'NICKNAME'])
  targetType: 'USER_ID' | 'NICKNAME';

  @ApiProperty({ description: 'User ID or Nickname' })
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
