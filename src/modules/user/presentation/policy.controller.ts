import { Controller, Get } from '@nestjs/common';
import { prisma } from '../../../libs/prisma';

@Controller('privacy')
export class PolicyController {
  @Get('latest')
  async getLatestPrivacyPolicy() {
    return prisma.privacyPolicy.findFirst({
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('history')
  async getPrivacyPolicyHistory() {
    return prisma.privacyPolicy.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}

@Controller('terms')
export class TermsController {
  @Get('latest')
  async getLatestTerms() {
    return prisma.termsOfService.findFirst({
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('history')
  async getTermsHistory() {
    return prisma.termsOfService.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}
