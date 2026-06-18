import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { InquiryType } from '../../../../../generated/prisma/enums';

export class CreateInquiryDto {
  @IsString()
  @IsNotEmpty({ message: '제목을 입력해 주세요.' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: '내용을 입력해 주세요.' })
  content: string;

  @IsEnum(InquiryType)
  type: InquiryType;

  @IsOptional()
  @IsString()
  paymentId?: string;
}
