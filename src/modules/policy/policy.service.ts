import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { prisma } from '../../libs/prisma';

@Injectable()
export class PolicyService {
  async getPoliciesList(type: string) {
    if (type === 'privacy') {
      const versions = await prisma.privacyPolicy.findMany({
        select: { id: true, version: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      });
      const latest = await prisma.privacyPolicy.findFirst({
        orderBy: { createdAt: 'desc' },
      });
      return { versions, latest };
    } else if (type === 'terms') {
      const versions = await prisma.termsOfService.findMany({
        select: { id: true, version: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      });
      const latest = await prisma.termsOfService.findFirst({
        orderBy: { createdAt: 'desc' },
      });
      return { versions, latest };
    }
    throw new BadRequestException('Invalid policy type');
  }

  async getPolicyVersion(type: string, id: number) {
    if (type === 'privacy') {
      const policy = await prisma.privacyPolicy.findUnique({
        where: { id },
      });
      if (!policy) throw new NotFoundException('Policy not found');
      return policy;
    } else if (type === 'terms') {
      const policy = await prisma.termsOfService.findUnique({
        where: { id },
      });
      if (!policy) throw new NotFoundException('Policy not found');
      return policy;
    }
    throw new BadRequestException('Invalid policy type');
  }

  async createPolicyVersion(
    type: string,
    data: { version?: string; content: string },
  ) {
    if (type === 'privacy') {
      return await prisma.privacyPolicy.create({
        data: {
          version: data.version,
          content: data.content,
        },
      });
    } else if (type === 'terms') {
      return await prisma.termsOfService.create({
        data: {
          version: data.version,
          content: data.content,
        },
      });
    }
    throw new BadRequestException('Invalid policy type');
  }

  async updatePolicyVersion(
    type: string,
    id: number,
    data: { version?: string; content: string },
  ) {
    if (type === 'privacy') {
      return await prisma.privacyPolicy.update({
        where: { id },
        data: {
          version: data.version,
          content: data.content,
        },
      });
    } else if (type === 'terms') {
      return await prisma.termsOfService.update({
        where: { id },
        data: {
          version: data.version,
          content: data.content,
        },
      });
    }
    throw new BadRequestException('Invalid policy type');
  }

  async deletePolicyVersion(type: string, id: number) {
    if (type === 'privacy') {
      return await prisma.privacyPolicy.delete({
        where: { id },
      });
    } else if (type === 'terms') {
      return await prisma.termsOfService.delete({
        where: { id },
      });
    }
    throw new BadRequestException('Invalid policy type');
  }
}
