import { IsNotEmpty, IsString, IsDateString } from 'class-validator';

export class CreateNoticeDto {
  @IsString()
  @IsNotEmpty({ message: '공지 제목을 입력해 주세요.' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: '공지 내용을 입력해 주세요.' })
  content: string;

  @IsDateString({}, { message: '올바른 날짜 형식이 아닙니다.' })
  endsAt: string;
}

export class UpdateNoticeDto {
  @IsString()
  @IsNotEmpty({ message: '공지 제목을 입력해 주세요.' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: '공지 내용을 입력해 주세요.' })
  content: string;

  @IsDateString({}, { message: '올바른 날짜 형식이 아닙니다.' })
  endsAt: string;
}
