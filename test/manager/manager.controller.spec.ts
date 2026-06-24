import { Test, TestingModule } from '@nestjs/testing';
import { ManagerController } from '../../src/modules/manager/presentation/manager.controller';
import { VISITOR_REPOSITORY_TOKEN } from '../../src/modules/user/domain/ports/visitor.port';
import { HonService } from '../../src/modules/user/application/hon.service';
import { RedisService } from '../../src/helpers/redis/application/redis.service';
import { NotFoundException } from '@nestjs/common';
import { RequestParser } from '../../src/common/utils/request-parser';

// Mock prisma
jest.mock('../../src/libs/prisma', () => ({
  prisma: {
    notice: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    inquiry: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    visitor: {
      findUnique: jest.fn(),
    },
    paymentProjection: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  },
}));

import { prisma } from '../../src/libs/prisma';

describe('ManagerController', () => {
  let controller: ManagerController;
  let mockVisitorRepository: any;
  let mockHonService: any;
  let mockRedisService: any;

  beforeEach(async () => {
    mockVisitorRepository = {
      updateBlockStatus: jest.fn().mockResolvedValue(undefined),
    };

    mockHonService = {
      provisionHonByAdmin: jest.fn(),
      provisionUnlimitedSubscriptionByAdmin: jest.fn(),
    };

    mockRedisService = {
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ManagerController],
      providers: [
        { provide: VISITOR_REPOSITORY_TOKEN, useValue: mockVisitorRepository },
        { provide: HonService, useValue: mockHonService },
        { provide: RedisService, useValue: mockRedisService },
        {
          provide: RequestParser,
          useValue: {
            getIpOrThrow: jest.fn(),
            getHeaders: jest.fn(),
            getCookies: jest.fn(),
            getVisitorId: jest.fn(),
            getMasterKey: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ManagerController>(ManagerController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllNotices', () => {
    it('should return all notices list', async () => {
      const mockNotices = [{ id: 1, title: 'Notice 1' }];
      (prisma.notice.findMany as jest.Mock).mockResolvedValue(mockNotices);

      const result = await controller.getAllNotices();

      expect(result).toEqual({ success: true, data: mockNotices });
      expect(prisma.notice.findMany).toHaveBeenCalled();
    });
  });

  describe('createNotice', () => {
    it('should create notice and return success', async () => {
      const mockNotice = { id: 1, title: 'New Notice', content: 'content' };
      (prisma.notice.create as jest.Mock).mockResolvedValue(mockNotice);

      const result = await controller.createNotice({
        title: 'New Notice',
        content: 'content',
        endsAt: '2026-12-31T23:59:59.000Z',
      });

      expect(result).toEqual({ success: true, data: mockNotice });
      expect(prisma.notice.create).toHaveBeenCalled();
    });
  });

  describe('blockVisitor', () => {
    it('should throw NotFoundException if visitor is not found', async () => {
      (prisma.visitor.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(controller.blockVisitor('visitor-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should block visitor, update DB and save to redis status', async () => {
      (prisma.visitor.findUnique as jest.Mock).mockResolvedValue({
        id: 'visitor-1',
      });

      const result = await controller.blockVisitor('visitor-1');

      expect(result).toEqual({ success: true });
      expect(mockVisitorRepository.updateBlockStatus).toHaveBeenCalledWith(
        'visitor-1',
        true,
      );
      expect(mockRedisService.set).toHaveBeenCalledWith(
        'visitor-blocked:visitor-1',
        'true',
        expect.any(Number),
      );
    });
  });
});
