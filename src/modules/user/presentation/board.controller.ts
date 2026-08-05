import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { prisma } from '../../../libs/prisma';
import { RequestParser } from '../../../common/utils/request-parser';
import {
  CreatePostDto,
  ReportPostDto,
} from './dtos/requests/board-requests.dto';
import { BoardCategory } from '../../../generated/prisma/client';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { LottoOcrService } from '../application/lotto-ocr.service';
import { RedisService } from '../../../helpers/redis/application/redis.service';

@ApiTags('- Board')
@Controller('user/board')
export class BoardController {
  constructor(
    private readonly requestParser: RequestParser,
    private readonly lottoOcrService: LottoOcrService,
    private readonly redisService: RedisService,
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
          user: { select: { id: true, nickname: true, avatarUrl: true } },
          _count: { select: { likes: true, comments: true } },
          attachments: true,
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

    let userId: string | undefined = undefined;
    try {
      userId = this.requestParser.getUserId();
    } catch (e) {
      console.error(e);
    }

    const post = await prisma.post.findUnique({
      where: { id: numId },
      include: {
        user: { select: { id: true, nickname: true, avatarUrl: true } },
        _count: { select: { likes: true, comments: true } },
        attachments: true,
        comments: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, nickname: true, avatarUrl: true } },
            _count: { select: { likes: true } },
            likes: userId ? { where: { userId } } : false,
          },
        },
        likes: userId ? { where: { userId } } : false,
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
  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  async toggleLike(@Param('id') id: string) {
    const numId = parseInt(id, 10);
    if (isNaN(numId))
      throw new BadRequestException('올바르지 않은 ID 형식입니다.');
    const userId = this.requestParser.getUserId();
    if (!userId)
      throw new UnauthorizedException('방문자 ID가 유효하지 않습니다.');

    const existing = await prisma.postLike.findUnique({
      where: { postId_userId: { postId: numId, userId } },
    });

    if (existing) {
      await prisma.postLike.delete({
        where: { postId_userId: { postId: numId, userId } },
      });
      return { success: true, liked: false };
    } else {
      await prisma.postLike.create({ data: { postId: numId, userId } });
      return { success: true, liked: true };
    }
  }

  @ApiOperation({ summary: 'Create comment' })
  @UseGuards(JwtAuthGuard)
  @Post(':id/comments')
  async createComment(
    @Param('id') id: string,
    @Body('content') content: string,
  ) {
    const numId = parseInt(id, 10);
    if (isNaN(numId))
      throw new BadRequestException('올바르지 않은 ID 형식입니다.');
    if (!content) throw new BadRequestException('내용이 필요합니다.');

    const userId = this.requestParser.getUserId();
    if (!userId)
      throw new UnauthorizedException('방문자 ID가 유효하지 않습니다.');

    const masterKey = this.requestParser.getMasterKey();
    let isAdmin = false;
    if (masterKey) {
      isAdmin = await this.redisService.validateMasterKey(masterKey);
    }

    const comment = await prisma.postComment.create({
      data: {
        postId: numId,
        userId,
        content,
        isAdmin,
      },
    });
    return { success: true, data: comment };
  }

  @ApiOperation({ summary: 'Delete comment' })
  @UseGuards(JwtAuthGuard)
  @Delete(':id/comments/:commentId')
  async deleteComment(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
  ) {
    const numId = parseInt(id, 10);
    const numCommentId = parseInt(commentId, 10);
    if (isNaN(numId) || isNaN(numCommentId))
      throw new BadRequestException('Invalid ID');

    const userId = this.requestParser.getUserId();
    if (!userId)
      throw new UnauthorizedException('방문자 ID가 유효하지 않습니다.');

    const comment = await prisma.postComment.findUnique({
      where: { id: numCommentId },
    });
    if (!comment) throw new NotFoundException('댓글이 존재하지 않습니다.');
    if (comment.userId !== userId)
      throw new UnauthorizedException('삭제 권한이 없습니다.');

    await prisma.postComment.delete({ where: { id: numCommentId } });
    return { success: true };
  }

  @ApiOperation({ summary: 'Toggle comment like' })
  @UseGuards(JwtAuthGuard)
  @Post(':id/comments/:commentId/like')
  async toggleCommentLike(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
  ) {
    const numCommentId = parseInt(commentId, 10);
    if (isNaN(numCommentId)) throw new BadRequestException('Invalid ID');

    const userId = this.requestParser.getUserId();
    if (!userId)
      throw new UnauthorizedException('방문자 ID가 유효하지 않습니다.');

    const existing = await prisma.commentLike.findUnique({
      where: { commentId_userId: { commentId: numCommentId, userId } },
    });

    if (existing) {
      await prisma.commentLike.delete({
        where: { commentId_userId: { commentId: numCommentId, userId } },
      });
      return { success: true, liked: false };
    } else {
      await prisma.commentLike.create({
        data: { commentId: numCommentId, userId },
      });
      return { success: true, liked: true };
    }
  }

  @ApiOperation({ summary: 'Report comment' })
  @UseGuards(JwtAuthGuard)
  @Post(':id/comments/:commentId/report')
  async reportComment(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @Body('reason') reason: string,
  ) {
    const numCommentId = parseInt(commentId, 10);
    if (isNaN(numCommentId)) throw new BadRequestException('Invalid ID');
    if (!reason) throw new BadRequestException('사유를 입력해주세요.');

    const userId = this.requestParser.getUserId();
    if (!userId)
      throw new UnauthorizedException('방문자 ID가 유효하지 않습니다.');

    await prisma.commentReport.create({
      data: {
        commentId: numCommentId,
        userId,
        reason,
      },
    });

    return { success: true };
  }

  @ApiOperation({ summary: 'Create a post' })
  @UseGuards(JwtAuthGuard)
  @Post()
  async createPost(@Body() body: CreatePostDto) {
    const userId = this.requestParser.getUserId();
    if (!userId) {
      throw new BadRequestException('방문자 ID가 존재하지 않습니다.');
    }

    // Ensure user exists in DB
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('회원 정보를 찾을 수 없습니다.');
    }

    if (body.category === BoardCategory.WINNING && !body.imageUrl) {
      throw new BadRequestException(
        '당첨 카테고리에는 인증 사진 첨부가 필수입니다.',
      );
    }

    const masterKey = this.requestParser.getMasterKey();
    let isAdmin = false;
    if (masterKey) {
      isAdmin = await this.redisService.validateMasterKey(masterKey);
    }

    const post = await prisma.post.create({
      data: {
        userId,
        category: body.category,
        title: body.title,
        content: body.content,
        imageUrl: body.imageUrl,
        originalFileName: body.originalFileName ?? null,
        isAdmin,
        lottoRank:
          body.category === BoardCategory.WINNING ? body.lottoRank : null,
        lottoRound:
          body.category === BoardCategory.WINNING ? body.lottoRound : null,
        lottoIdentifier:
          body.category === BoardCategory.WINNING ? body.lottoIdentifier : null,
        attachments: body.attachments?.length
          ? {
              create: body.attachments.map((att: any) => ({
                imageUrl: att.imageUrl,
                originalFileName: att.originalFileName ?? null,
              })),
            }
          : undefined,
      },
      include: {
        attachments: true,
      },
    });

    return { success: true, data: post };
  }

  @ApiOperation({ summary: 'Update a post' })
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updatePost(@Param('id') id: string, @Body() body: any) {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      throw new BadRequestException('올바르지 않은 ID 형식입니다.');
    }

    const userId = this.requestParser.getUserId();
    const masterKey = this.requestParser.getMasterKey();

    const post = await prisma.post.findUnique({ where: { id: numId } });
    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    let isAdmin = false;
    if (masterKey) {
      isAdmin = await this.redisService.validateMasterKey(masterKey);
    }

    if (post.userId !== userId && !isAdmin) {
      throw new BadRequestException('본인의 게시글만 수정할 수 있습니다.');
    }

    if (post.isAdmin && !isAdmin) {
      throw new BadRequestException(
        '관리자가 작성한 게시글은 관리자만 수정할 수 있습니다.',
      );
    }

    const updatedPost = await prisma.post.update({
      where: { id: numId },
      data: {
        title: body.title !== undefined ? body.title : post.title,
        content: body.content !== undefined ? body.content : post.content,
        imageUrl: body.imageUrl !== undefined ? body.imageUrl : post.imageUrl,
        originalFileName:
          body.imageUrl === null
            ? null
            : body.originalFileName !== undefined
              ? body.originalFileName
              : post.originalFileName,
        ...(body.attachments !== undefined && {
          attachments: {
            deleteMany: {},
            create: body.attachments.map((att: any) => ({
              imageUrl: att.imageUrl,
              originalFileName: att.originalFileName ?? null,
            })),
          },
        }),
      },
      include: {
        attachments: true,
      },
    });

    return { success: true, data: updatedPost };
  }

  @ApiOperation({ summary: 'Delete a post' })
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deletePost(@Param('id') id: string) {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      throw new BadRequestException('올바르지 않은 ID 형식입니다.');
    }

    const userId = this.requestParser.getUserId();
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

    if (post.userId !== userId && !isAdmin) {
      throw new BadRequestException('본인의 게시글만 삭제할 수 있습니다.');
    }

    if (post.isAdmin && !isAdmin) {
      throw new BadRequestException(
        '관리자가 작성한 게시글은 관리자만 삭제할 수 있습니다.',
      );
    }

    if (post.imageUrl) {
      try {
        const url = new URL(post.imageUrl);
        const filename = path.basename(url.pathname);
        const filePath = path.join(
          __dirname,
          '..',
          '..',
          '..',
          '..',
          'attachments',
          filename,
        );
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
        }
      } catch (err) {
        console.error('Failed to delete local object when deleting post:', err);
      }
    }

    await prisma.post.delete({ where: { id: numId } });
    return { success: true };
  }

  @ApiOperation({ summary: 'Report a post' })
  @UseGuards(JwtAuthGuard)
  @Post(':id/report')
  async reportPost(@Param('id') id: string, @Body() body: ReportPostDto) {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      throw new BadRequestException('올바르지 않은 ID 형식입니다.');
    }

    const userId = this.requestParser.getUserId();
    if (!userId) {
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
        userId,
      },
    });

    if (existing) {
      throw new BadRequestException('이미 이 게시글을 신고하셨습니다.');
    }

    const report = await prisma.postReport.create({
      data: {
        postId: numId,
        userId,
        reason: body.reason,
      },
    });

    return { success: true, data: report };
  }

  @ApiOperation({ summary: 'Upload file for board' })
  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: path.join(
          __dirname,
          '..',
          '..',
          '..',
          '..',
          'attachments',
        ),
        filename: (req, file, cb) => {
          // Decode filename from latin1 (multer default) to utf8
          file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const safeFilename = file.originalname.replace(
            /[^a-zA-Z0-9.\-_가-힣ㄱ-ㅎㅏ-ㅣ]/g,
            '_',
          );
          cb(null, `${uniqueSuffix}-${safeFilename}`);
        },
      }),
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('파일이 업로드되지 않았습니다.');
    }

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const imageUrl = `${appUrl}/hactto/v1/attachments/${file.filename}`;

    return {
      success: true,
      data: {
        imageUrl,
        originalFilename: file.originalname,
      },
    };
  }

  @ApiOperation({ summary: 'Analyze Lotto Image for Winning Rank' })
  @UseGuards(JwtAuthGuard)
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
