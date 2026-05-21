import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateMasterKeyRequestDto {
  @ApiProperty({
    example: 'my_secret_master_key_123',
    description: '등록할 마스터 키 값',
  })
  @IsString()
  @IsNotEmpty()
  mk: string;
}
