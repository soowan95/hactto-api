import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Admin } from '../../../common/decorators/admin.decorator';
import {
  IVisitorRepository,
  VISITOR_REPOSITORY_TOKEN,
} from '../domain/ports/visitor.port';
import { HonService } from '../application/hon.service';
import { RedisService } from '../../../helpers/redis/application/redis.service';
import { prisma } from '../../../libs/prisma';
import { IsNumber, IsDateString } from 'class-validator';

class ManageHonDto {
  @IsNumber()
  amount: number;
}

class GrantSubscriptionDto {
  @IsDateString()
  endsAt: string;
}

@ApiTags('- Admin Visitors')
@Admin()
@Controller('admin/visitors')
export class VisitorAdminController {
  constructor(
    @Inject(VISITOR_REPOSITORY_TOKEN)
    private readonly visitorRepository: IVisitorRepository,
    private readonly honService: HonService,
    private readonly redisService: RedisService,
  ) {}

  @ApiOperation({ summary: 'Get visitor details for admin' })
  @Get(':id')
  async getVisitorDetails(@Param('id') id: string) {
    const visitor = await prisma.visitor.findUnique({
      where: { id },
      include: {
        hon: true,
        subscription: true,
      },
    });

    if (!visitor) {
      throw new NotFoundException('방문자를 찾을 수 없습니다.');
    }

    return {
      id: visitor.id,
      ip: visitor.ip,
      isBlocked: visitor.isBlocked,
      hon: visitor.hon ? { balance: visitor.hon.balance } : { balance: 0 },
      subscription: visitor.subscription
        ? {
            plan: visitor.subscription.plan,
            status: visitor.subscription.status,
            startsAt: visitor.subscription.startsAt,
            endsAt: visitor.subscription.endsAt,
            nextPaymentAt: visitor.subscription.nextPaymentAt,
          }
        : null,
    };
  }

  @ApiOperation({ summary: 'Block visitor' })
  @Post(':id/block')
  async blockVisitor(@Param('id') id: string) {
    const visitor = await prisma.visitor.findUnique({ where: { id } });
    if (!visitor) {
      throw new NotFoundException('방문자를 찾을 수 없습니다.');
    }

    await this.visitorRepository.updateBlockStatus(id, true);
    await this.redisService.set(`visitor-blocked:${id}`, 'true', 86400 * 7);

    return { success: true };
  }

  @ApiOperation({ summary: 'Unblock visitor' })
  @Post(':id/unblock')
  async unblockVisitor(@Param('id') id: string) {
    const visitor = await prisma.visitor.findUnique({ where: { id } });
    if (!visitor) {
      throw new NotFoundException('방문자를 찾을 수 없습니다.');
    }

    await this.visitorRepository.updateBlockStatus(id, false);
    await this.redisService.set(`visitor-blocked:${id}`, 'false', 86400 * 7);

    return { success: true };
  }

  @ApiOperation({ summary: 'Add or deduct Hon for visitor' })
  @Post(':id/hon')
  async manageHon(@Param('id') id: string, @Body() body: ManageHonDto) {
    const visitor = await prisma.visitor.findUnique({ where: { id } });
    if (!visitor) {
      throw new NotFoundException('방문자를 찾을 수 없습니다.');
    }

    await this.honService.provisionHonByAdmin(id, body.amount);
    return { success: true };
  }

  @ApiOperation({ summary: 'Grant free pass subscription' })
  @Post(':id/subscription/unlimited')
  async grantUnlimitedPass(
    @Param('id') id: string,
    @Body() body: GrantSubscriptionDto,
  ) {
    const visitor = await prisma.visitor.findUnique({ where: { id } });
    if (!visitor) {
      throw new NotFoundException('방문자를 찾을 수 없습니다.');
    }

    await this.honService.provisionUnlimitedSubscriptionByAdmin(
      id,
      new Date(body.endsAt),
    );
    return { success: true };
  }
}
