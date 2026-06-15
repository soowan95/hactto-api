import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RequestParser } from '../../../common/utils/request-parser';
import { prisma } from '../../../libs/prisma';
import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

class CreateInquiryDto {
  @IsString()
  @IsNotEmpty({ message: '제목을 입력해 주세요.' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: '내용을 입력해 주세요.' })
  content: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  isForBlock?: boolean;
}

@ApiTags('- Manager (Visitor)')
@Controller('manager')
export class ManagerController {
  constructor(private readonly requestParser: RequestParser) {}

  @ApiOperation({ summary: 'Submit an inquiry' })
  @Post('inquiries')
  async createInquiry(@Body() body: CreateInquiryDto) {
    const visitorId = this.requestParser.getVisitorId();
    if (!visitorId) {
      throw new BadRequestException('방문자 ID가 존재하지 않습니다.');
    }

    // Check if visitor exists in db
    let visitor = await prisma.visitor.findUnique({
      where: { id: visitorId },
    });
    if (!visitor) {
      let ip = '0.0.0.0';
      try {
        ip = this.requestParser.getIpOrThrow();
      } catch {
        // Ignore ip detection errors
      }

      visitor = await prisma.visitor.create({
        data: {
          id: visitorId,
          ip,
        },
      });

      // Initialize default 50 Hon balance
      await prisma.hon.create({
        data: {
          visitorId,
          balance: 50,
        },
      });
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        visitorId,
        title: body.title,
        content: body.content,
        isForBlock: body.isForBlock ?? false,
      },
    });

    return { success: true, data: inquiry };
  }

  @ApiOperation({ summary: 'Get visitor inquiries' })
  @Get('inquiries')
  async getInquiries(@Query('forBlock') forBlock?: string) {
    const visitorId = this.requestParser.getVisitorId();
    if (!visitorId) {
      throw new BadRequestException('방문자 ID가 존재하지 않습니다.');
    }

    const isForBlock = forBlock === 'true';

    const inquiries = await prisma.inquiry.findMany({
      where: { visitorId, isForBlock },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: inquiries };
  }

  @ApiOperation({ summary: 'Get active notices' })
  @Get('notices')
  async getActiveNotices() {
    const now = new Date();
    const notices = await prisma.notice.findMany({
      where: {
        endsAt: {
          gt: now,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: notices };
  }
}
