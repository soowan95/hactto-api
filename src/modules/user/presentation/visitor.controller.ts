import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BadRequestException, Controller, Inject, Post } from '@nestjs/common';
import {
  IVisitorRepository,
  VISITOR_REPOSITORY_TOKEN,
} from '../domain/ports/visitor.port';
import { RedisService } from '../../../helpers/redis/application/redis.service';
import { RequestParser } from '../../../common/utils/request-parser';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';

@ApiTags('- Visitor')
@Controller('visitor')
export class VisitorController {
  constructor(
    @Inject(VISITOR_REPOSITORY_TOKEN)
    private readonly visitorRepository: IVisitorRepository,
    private readonly redisService: RedisService,
    private readonly requestParser: RequestParser,
  ) {}

  @ApiOperation({ summary: 'Register visitor' })
  @ResponseMessage('success.register.visitor')
  @Post('register')
  async register(): Promise<void> {
    const ip = this.requestParser.getIpOrThrow();
    const visitorId = this.requestParser.getVisitorId();

    if (!visitorId) {
      throw new BadRequestException('Visitor ID가 유효하지 않습니다.');
    }

    const redisKey = `visitor-ip:${visitorId}`;
    await this.redisService.set(redisKey, ip, 604800); // 7 days expiration
    await this.visitorRepository.insert(visitorId, ip);
  }
}
