import { Test, TestingModule } from '@nestjs/testing';
import { RedisController } from './redis.controller';
import { RedisService } from '../application/redis.service';
import { Request, Response } from 'express';
import { ForbiddenException } from '@nestjs/common';
import { RequestParser } from '../../../common/utils/request-parser';
import { HonService } from '../../../modules/user/application/hon.service';

describe('RedisController', () => {
  let controller: RedisController;
  let redisService: jest.Mocked<RedisService>;
  let currentRequest: any;

  beforeEach(async () => {
    currentRequest = null;

    const mockRedisService = {
      addToSet: jest.fn(),
      signAccessPayload: jest.fn(),
      generateMasterKey: jest.fn(),
      getFromSet: jest.fn(),
      removeFromSet: jest.fn(),
      reset: jest.fn(),
      resetAll: jest.fn(),
      isMemberOfSet: jest.fn(),
      verifyAccessPayload: jest.fn(),
    };

    const mockRequestParser = {
      getIpOrThrow: jest.fn().mockImplementation(() => {
        const ip =
          currentRequest?.headers?.['x-forwarded-for'] ||
          currentRequest?.socket?.remoteAddress;
        if (!ip) throw new ForbiddenException('IP 주소를 식별할 수 없습니다.');
        return ip;
      }),
      getHeaders: jest.fn().mockImplementation((path?: string) => {
        if (path) return currentRequest?.headers?.[path];
        return currentRequest?.headers;
      }),
      getCookies: jest.fn().mockImplementation(() => {
        const cookieHeader = currentRequest?.headers?.cookie;
        if (cookieHeader) {
          return cookieHeader.split(';').reduce((cookies: any, cookie: any) => {
            const [name, value] = cookie.trim().split('=');
            cookies[name] = value;
            return cookies;
          }, {});
        }
        return {};
      }),
      getVisitorId: jest.fn().mockImplementation(() => {
        return (
          currentRequest?.query?.visitorId || currentRequest?.body?.visitorId
        );
      }),
      getMasterKey: jest.fn().mockImplementation(() => {
        return currentRequest?.query?.mk || currentRequest?.body?.mk;
      }),
    };

    const mockHonService = {
      getHon: jest.fn().mockResolvedValue({ balance: 0 }),
      getSubscription: jest.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RedisController],
      providers: [
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: RequestParser,
          useValue: mockRequestParser,
        },
        {
          provide: HonService,
          useValue: mockHonService,
        },
      ],
    }).compile();

    controller = module.get<RedisController>(RedisController);
    redisService = module.get(
      RedisService,
    ) as unknown as jest.Mocked<RedisService>;
  });

  const createMockReqRes = (
    ip: string,
    countryHeader?: string,
  ): { req: Request; res: Response } => {
    const req = {
      headers: {
        'x-forwarded-for': ip,
        'cf-ipcountry': countryHeader,
      },
      socket: {
        remoteAddress: ip,
      },
    } as unknown as Request;

    const res = {
      cookie: jest.fn(),
    } as unknown as Response;

    return { req, res };
  };

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('generateMasterKey', () => {
    it('should generate master key', async () => {
      redisService.generateMasterKey.mockResolvedValue('test-key');
      const result = await controller.generateMasterKey();
      expect(result).toBe('test-key');
      expect(redisService.generateMasterKey).toHaveBeenCalled();
    });
  });

  describe('resetCurrentDatabase', () => {
    it('should reset redis', async () => {
      redisService.reset.mockResolvedValue(undefined);
      await controller.resetCurrentDatabase();
      expect(redisService.reset).toHaveBeenCalled();
    });
  });

  describe('checkIp', () => {
    it('should return allowed true for queryMk when it is in manager:k set', async () => {
      const { req } = createMockReqRes('127.0.0.1');
      currentRequest = req;
      redisService.isMemberOfSet.mockResolvedValue(true);
      const result = await controller.checkIp('test-key');
      expect(result.allowed).toBe(true);
      expect(redisService.isMemberOfSet).toHaveBeenCalledWith(
        'manager:k',
        'test-key',
      );
    });

    it('should return allowed false for queryMk when it is not in manager:k set', async () => {
      const { req } = createMockReqRes('127.0.0.1');
      currentRequest = req;
      redisService.isMemberOfSet.mockResolvedValue(false);
      const result = await controller.checkIp('test-key');
      expect(result.allowed).toBe(false);
      expect(redisService.isMemberOfSet).toHaveBeenCalledWith(
        'manager:k',
        'test-key',
      );
    });

    it('should return allowed true if queryMk is not provided', async () => {
      const { req } = createMockReqRes('127.0.0.1');
      currentRequest = req;
      const result = await controller.checkIp();
      expect(result.allowed).toBe(true);
    });
  });
});
