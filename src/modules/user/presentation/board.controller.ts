import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Query,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { prisma } from '../../../libs/prisma';
import { RequestParser } from '../../../common/utils/request-parser';
import {
  CreatePostDto,
  ReportPostDto,
} from './dtos/requests/board-requests.dto';
import { BoardCategory } from '../../../generated/prisma/client';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { LottoOcrService } from '../application/lotto-ocr.service';

@ApiTags('- Board')
@Controller('user/board')
export class BoardController {
  constructor(
    private readonly requestParser: RequestParser,
    private readonly lottoOcrService: LottoOcrService,
  ) {}

  @ApiOperation({ summary: 'Get posts with pagination and category filter' })
  @Get()
  async getPosts(
    @Query('category') category?: BoardCategory,
    @Query('sort') sort: 'latest' | 'likes' = 'latest',
    @Query('rank') rank?: string,
    @Query('round') round?: string,
    @Query('page') pageStr: string = '1',
    @Query('limit') limitStr: string = '15',
  ) {
    const page = parseInt(pageStr, 10) || 1;
    const limit = parseInt(limitStr, 10) || 15;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (category) {
      where.category = category;
      if (category === BoardCategory.WINNING) {
        if (rank) {
          where.lottoRank = parseInt(rank, 10);
        }
        if (round) {
          where.lottoRound = parseInt(round, 10);
        }
      }
    }

    const orderBy: any =
      sort === 'likes' ? { likes: { _count: 'desc' } } : { createdAt: 'desc' };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          visitor: { select: { nickname: true } },
          _count: { select: { likes: true, comments: true } },
        },
      }),
      prisma.post.count({ where }),
    ]);

    return {
      success: true,
      data: posts,
      meta: { total, page, limit },
    };
  }

  @ApiOperation({ summary: 'Get single post details' })
  @Get(':id')
  async getPost(@Param('id') id: string) {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      throw new BadRequestException('올바르지 않은 ID 형식입니다.');
    }

    let visitorId: string | undefined = undefined;
    try {
      visitorId = this.requestParser.getVisitorId();
    } catch (e) {
      console.error(e);
    }

    const post = await prisma.post.findUnique({
      where: { id: numId },
      include: {
        visitor: { select: { nickname: true } },
        _count: { select: { likes: true, comments: true } },
        comments: {
          orderBy: { createdAt: 'desc' },
          include: {
            visitor: { select: { nickname: true } },
            _count: { select: { likes: true } },
            likes: visitorId ? { where: { visitorId } } : false,
          },
        },
        likes: visitorId ? { where: { visitorId } } : false,
      },
    });

    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    const isLiked = post.likes && post.likes.length > 0;
    const comments = post.comments.map((c) => ({
      ...c,
      isLiked: c.likes && c.likes.length > 0,
      likes: undefined,
    }));

    return {
      success: true,
      data: {
        ...post,
        isLiked,
        likes: undefined,
        comments,
      },
    };
  }

  @ApiOperation({ summary: 'Toggle post like' })
  @Post(':id/like')
  async toggleLike(@Param('id') id: string) {
    const numId = parseInt(id, 10);
    if (isNaN(numId))
      throw new BadRequestException('올바르지 않은 ID 형식입니다.');
    const visitorId = this.requestParser.getVisitorId();
    if (!visitorId)
      throw new UnauthorizedException('방문자 ID가 유효하지 않습니다.');

    const existing = await prisma.postLike.findUnique({
      where: { postId_visitorId: { postId: numId, visitorId } },
    });

    if (existing) {
      await prisma.postLike.delete({
        where: { postId_visitorId: { postId: numId, visitorId } },
      });
      return { success: true, liked: false };
    } else {
      await prisma.postLike.create({ data: { postId: numId, visitorId } });
      return { success: true, liked: true };
    }
  }

  @ApiOperation({ summary: 'Create comment' })
  @Post(':id/comments')
  async createComment(
    @Param('id') id: string,
    @Body('content') content: string,
  ) {
    const numId = parseInt(id, 10);
    if (isNaN(numId))
      throw new BadRequestException('올바르지 않은 ID 형식입니다.');
    if (!content) throw new BadRequestException('내용이 필요합니다.');

    const visitorId = this.requestParser.getVisitorId();
    if (!visitorId)
      throw new UnauthorizedException('방문자 ID가 유효하지 않습니다.');

    const comment = await prisma.postComment.create({
      data: {
        postId: numId,
        visitorId,
        content,
      },
    });
    return { success: true, data: comment };
  }

  @ApiOperation({ summary: 'Delete comment' })
  @Delete(':id/comments/:commentId')
  async deleteComment(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
  ) {
    const numId = parseInt(id, 10);
    const numCommentId = parseInt(commentId, 10);
    if (isNaN(numId) || isNaN(numCommentId))
      throw new BadRequestException('Invalid ID');

    const visitorId = this.requestParser.getVisitorId();
    if (!visitorId)
      throw new UnauthorizedException('방문자 ID가 유효하지 않습니다.');

    const comment = await prisma.postComment.findUnique({
      where: { id: numCommentId },
    });
    if (!comment) throw new NotFoundException('댓글이 존재하지 않습니다.');
    if (comment.visitorId !== visitorId)
      throw new UnauthorizedException('삭제 권한이 없습니다.');

    await prisma.postComment.delete({ where: { id: numCommentId } });
    return { success: true };
  }

  @ApiOperation({ summary: 'Toggle comment like' })
  @Post(':id/comments/:commentId/like')
  async toggleCommentLike(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
  ) {
    const numCommentId = parseInt(commentId, 10);
    if (isNaN(numCommentId)) throw new BadRequestException('Invalid ID');

    const visitorId = this.requestParser.getVisitorId();
    if (!visitorId)
      throw new UnauthorizedException('방문자 ID가 유효하지 않습니다.');

    const existing = await prisma.commentLike.findUnique({
      where: { commentId_visitorId: { commentId: numCommentId, visitorId } },
    });

    if (existing) {
      await prisma.commentLike.delete({
        where: { commentId_visitorId: { commentId: numCommentId, visitorId } },
      });
      return { success: true, liked: false };
    } else {
      await prisma.commentLike.create({
        data: { commentId: numCommentId, visitorId },
      });
      return { success: true, liked: true };
    }
  }

  @ApiOperation({ summary: 'Report comment' })
  @Post(':id/comments/:commentId/report')
  async reportComment(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @Body('reason') reason: string,
  ) {
    const numCommentId = parseInt(commentId, 10);
    if (isNaN(numCommentId)) throw new BadRequestException('Invalid ID');
    if (!reason) throw new BadRequestException('사유를 입력해주세요.');

    const visitorId = this.requestParser.getVisitorId();
    if (!visitorId)
      throw new UnauthorizedException('방문자 ID가 유효하지 않습니다.');

    await prisma.commentReport.create({
      data: {
        commentId: numCommentId,
        visitorId,
        reason,
      },
    });

    return { success: true };
  }

  @ApiOperation({ summary: 'Create a post' })
  @Post()
  async createPost(@Body() body: CreatePostDto) {
    const visitorId = this.requestParser.getVisitorId();
    if (!visitorId) {
      throw new BadRequestException('방문자 ID가 존재하지 않습니다.');
    }

    // Ensure visitor exists in DB
    let visitor = await prisma.visitor.findUnique({ where: { id: visitorId } });
    if (!visitor) {
      let ip = '0.0.0.0';
      try {
        ip = this.requestParser.getIpOrThrow();
      } catch {}
      await prisma.visitor.create({
        data: { id: visitorId, ip },
      });
      await prisma.hon.create({
        data: { visitorId, freeBalance: 50, paidBalance: 0 },
      });
    }

    if (body.category === BoardCategory.WINNING && !body.imageUrl) {
      throw new BadRequestException(
        '당첨 카테고리에는 인증 사진 첨부가 필수입니다.',
      );
    }

    const post = await prisma.post.create({
      data: {
        visitorId,
        category: body.category,
        title: body.title,
        content: body.content,
        imageUrl: body.imageUrl,
        lottoRank:
          body.category === BoardCategory.WINNING ? body.lottoRank : null,
        lottoRound:
          body.category === BoardCategory.WINNING ? body.lottoRound : null,
        lottoIdentifier:
          body.category === BoardCategory.WINNING ? body.lottoIdentifier : null,
      },
    });

    return { success: true, data: post };
  }

  @ApiOperation({ summary: 'Delete a post' })
  @Delete(':id')
  async deletePost(@Param('id') id: string) {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      throw new BadRequestException('올바르지 않은 ID 형식입니다.');
    }

    const visitorId = this.requestParser.getVisitorId();
    const masterKey = this.requestParser.getMasterKey();

    const post = await prisma.post.findUnique({ where: { id: numId } });
    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    // Check if owner or admin
    let isAdmin = false;
    if (masterKey) {
      // Basic check or check masterkey validation
      isAdmin = true;
    }

    if (post.visitorId !== visitorId && !isAdmin) {
      throw new BadRequestException('본인의 게시글만 삭제할 수 있습니다.');
    }

    if (post.imageUrl) {
      try {
        const region = process.env.AWS_REGION || 'ap-northeast-2';
        const s3Bucket =
          process.env.AWS_S3_BUCKET || 'hactto-board-attachments';
        const s3Client = new S3Client({
          region: region,
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
          },
        });

        const url = new URL(post.imageUrl);
        const key = url.pathname.substring(1); // Remove leading slash

        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: s3Bucket,
            Key: key,
          }),
        );
      } catch (err) {
        console.error('Failed to delete S3 object when deleting post:', err);
      }
    }

    await prisma.post.delete({ where: { id: numId } });
    return { success: true };
  }

  @ApiOperation({ summary: 'Report a post' })
  @Post(':id/report')
  async reportPost(@Param('id') id: string, @Body() body: ReportPostDto) {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      throw new BadRequestException('올바르지 않은 ID 형식입니다.');
    }

    const visitorId = this.requestParser.getVisitorId();
    if (!visitorId) {
      throw new BadRequestException('방문자 ID가 존재하지 않습니다.');
    }

    const post = await prisma.post.findUnique({ where: { id: numId } });
    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    // Prevent duplicate report
    const existing = await prisma.postReport.findFirst({
      where: {
        postId: numId,
        visitorId,
      },
    });

    if (existing) {
      throw new BadRequestException('이미 이 게시글을 신고하셨습니다.');
    }

    const report = await prisma.postReport.create({
      data: {
        postId: numId,
        visitorId,
        reason: body.reason,
      },
    });

    return { success: true, data: report };
  }

  @ApiOperation({ summary: 'Generate S3 presigned URL for image upload' })
  @Post('presigned-url')
  async getPresignedUrl(
    @Body('filename') filename: string,
    @Body('contentType') contentType: string,
  ) {
    if (!filename || !contentType) {
      throw new BadRequestException('파일명과 Content-Type을 지정해야 합니다.');
    }

    const region = process.env.AWS_REGION || 'ap-northeast-2';
    const s3Bucket = process.env.AWS_S3_BUCKET || 'hactto-board-attachments';

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      // AWS credentials가 없으면 프론트엔드가 업로드 요청 시 실패할 수 있도록 임시(Mock)로라도 생성하여 반환하거나 에러를 발생시킴
      // 여기서는 명시적인 에러를 발생시킵니다.
      throw new BadRequestException(
        '서버에 S3 인증 정보가 설정되지 않았습니다.',
      );
    }

    const s3Client = new S3Client({
      region: region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      requestChecksumCalculation: 'WHEN_REQUIRED',
    });

    const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `uploads/${Date.now()}-${safeFilename}`;

    const command = new PutObjectCommand({
      Bucket: s3Bucket,
      Key: key,
      ContentType: contentType,
    });

    let uploadUrl = '';
    const imageUrl = `https://${s3Bucket}.s3.${region}.amazonaws.com/${key}`;

    try {
      uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
    } catch (error) {
      console.error('S3 Presigned URL Error:', error);
      throw new BadRequestException('업로드 URL을 생성할 수 없습니다.');
    }

    return {
      success: true,
      data: {
        uploadUrl,
        imageUrl,
      },
    };
  }

  @ApiOperation({ summary: 'Analyze Lotto Image for Winning Rank' })
  @Post('analyze-lotto')
  async analyzeLotto(@Body('imageUrl') imageUrl: string) {
    if (!imageUrl) {
      throw new BadRequestException('이미지 URL이 필요합니다.');
    }
    const result = await this.lottoOcrService.analyzeLottoImage(imageUrl);

    // 중복 로또 용지 검사 로직
    if (result.lottoIdentifier) {
      const existing = await prisma.post.findUnique({
        where: { lottoIdentifier: result.lottoIdentifier },
      });
      if (existing) {
        throw new BadRequestException(
          '이미 인증된 로또 용지입니다. 중복 인증은 불가합니다.',
        );
      }
    }

    return { success: true, data: result };
  }
}
