import { IsNotEmpty, IsString } from 'class-validator';

export class AnswerInquiryDto {
  @IsString()
  @IsNotEmpty({ message: '답변 내용을 입력해 주세요.' })
  answer: string;
}

export class RejectRefundDto {
  @IsString()
  @IsNotEmpty({ message: '거절 사유를 입력해 주세요.' })
  reason: string;
}

export class AnswerReportDto {
  @IsString()
  @IsNotEmpty({ message: '처리/답변 내용을 입력해 주세요.' })
  answer: string;
}
