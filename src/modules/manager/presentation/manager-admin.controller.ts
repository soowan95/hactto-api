import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Query,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Admin } from '../../../common/decorators/admin.decorator';
import { prisma } from '../../../libs/prisma';
import { IsNotEmpty, IsString, IsDateString } from 'class-validator';

class AnswerInquiryDto {
  @IsString()
  @IsNotEmpty({ message: '답변 내용을 입력해 주세요.' })
  answer: string;
}

class CreateNoticeDto {
  @IsString()
  @IsNotEmpty({ message: '공지 제목을 입력해 주세요.' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: '공지 내용을 입력해 주세요.' })
  content: string;

  @IsDateString({}, { message: '올바른 날짜 형식이 아닙니다.' })
  endsAt: string;
}

class UpdateNoticeDto {
  @IsString()
  @IsNotEmpty({ message: '공지 제목을 입력해 주세요.' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: '공지 내용을 입력해 주세요.' })
  content: string;

  @IsDateString({}, { message: '올바른 날짜 형식이 아닙니다.' })
  endsAt: string;
}

@ApiTags('- Admin Manager')
@Admin()
@Controller('manager/admin')
export class ManagerAdminController {

  @ApiOperation({ summary: 'Get all inquiries for admin' })
  @Get('inquiries')
  async getAllInquiries(@Query('forBlock') forBlock?: string) {
    const where: any = {};
    if (forBlock === 'true') where.isForBlock = true;
    else if (forBlock === 'false') where.isForBlock = false;

    const inquiries = await prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        visitor: true,
      },
    });

    return { success: true, data: inquiries };
  }

  @ApiOperation({ summary: 'Answer an inquiry' })
  @Post('inquiries/:id/answer')
  async answerInquiry(
    @Param('id') id: string,
    @Body() body: AnswerInquiryDto,
  ) {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) throw new BadRequestException('올바르지 않은 ID 형식입니다.');

    const inquiry = await prisma.inquiry.findUnique({ where: { id: numId } });
    if (!inquiry) {
      throw new NotFoundException('문의 내역을 찾을 수 없습니다.');
    }

    const updatedInquiry = await prisma.inquiry.update({
      where: { id: numId },
      data: {
        answer: body.answer,
        status: 'ANSWERED',
        answeredAt: new Date(),
      },
    });

    return { success: true, data: updatedInquiry };
  }

  @ApiOperation({ summary: 'Get all notices (including expired) for admin' })
  @Get('notices')
  async getAllNotices() {
    const notices = await prisma.notice.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: notices };
  }

  @ApiOperation({ summary: 'Create a new notice' })
  @Post('notices')
  async createNotice(@Body() body: CreateNoticeDto) {
    const notice = await prisma.notice.create({
      data: {
        title: body.title,
        content: body.content,
        endsAt: new Date(body.endsAt),
      },
    });

    return { success: true, data: notice };
  }

  @ApiOperation({ summary: 'Update an existing notice' })
  @Put('notices/:id')
  async updateNotice(
    @Param('id') id: string,
    @Body() body: UpdateNoticeDto,
  ) {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) throw new BadRequestException('올바르지 않은 ID 형식입니다.');

    const notice = await prisma.notice.findUnique({ where: { id: numId } });
    if (!notice) {
      throw new NotFoundException('공지사항을 찾을 수 없습니다.');
    }

    const updatedNotice = await prisma.notice.update({
      where: { id: numId },
      data: {
        title: body.title,
        content: body.content,
        endsAt: new Date(body.endsAt),
      },
    });

    return { success: true, data: updatedNotice };
  }

  @ApiOperation({ summary: 'Delete a notice' })
  @Delete('notices/:id')
  async deleteNotice(@Param('id') id: string) {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) throw new BadRequestException('올바르지 않은 ID 형식입니다.');

    const notice = await prisma.notice.findUnique({ where: { id: numId } });
    if (!notice) {
      throw new NotFoundException('공지사항을 찾을 수 없습니다.');
    }

    await prisma.notice.delete({ where: { id: numId } });
    return { success: true };
  }
}
