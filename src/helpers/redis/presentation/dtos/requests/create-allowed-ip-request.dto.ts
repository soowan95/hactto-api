import { ApiProperty } from '@nestjs/swagger';
import { IsIP, IsNotEmpty } from 'class-validator';

export class CreateAllowedIpRequestDto {
  @ApiProperty({
    example: '127.0.0.1',
    description: '등록할 IP 값',
  })
  @IsIP()
  @IsNotEmpty()
  ip: string;
}
