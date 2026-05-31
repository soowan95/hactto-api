import { Test, TestingModule } from '@nestjs/testing';
import { RedisController } from './redis.controller';
import { RedisService } from '../application/redis.service';
import { Request, Response } from 'express';
import { ForbiddenException } from '@nestjs/common';
import { RequestParser } from '../../../common/utils/request-parser';

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

  describe('requestAccess', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('localhost 환경에서는 국가 검증을 무시하고 대기열(pending:ips)에 IP를 등록해야 한다', async () => {
      process.env.NODE_ENV = 'localhost';
      const { req } = createMockReqRes('127.0.0.1');
      currentRequest = req;

      await controller.requestAccess();

      expect(redisService.addToSet).toHaveBeenCalledWith(
        'pending:ips',
        '127.0.0.1',
      );
    });

    it('프로덕션 환경에서 대한민국(KR) IP이면 대기열(pending:ips)에 IP를 등록해야 한다', async () => {
      process.env.NODE_ENV = 'production';
      const { req } = createMockReqRes('1.2.3.4', 'KR');
      currentRequest = req;

      await controller.requestAccess();

      expect(redisService.addToSet).toHaveBeenCalledWith(
        'pending:ips',
        '1.2.3.4',
      );
    });

    it('프로덕션 환경에서 대한민국 IP가 아니면(예: US) ForbiddenException을 발생시켜야 한다', async () => {
      process.env.NODE_ENV = 'production';
      const { req } = createMockReqRes('1.2.3.4', 'US');
      currentRequest = req;

      await expect(controller.requestAccess()).rejects.toThrow(
        ForbiddenException,
      );
      expect(redisService.addToSet).not.toHaveBeenCalled();
    });

    it('프로덕션 환경에서 국가 헤더가 누락되면 ForbiddenException을 발생시켜야 한다', async () => {
      process.env.NODE_ENV = 'production';
      const { req } = createMockReqRes('1.2.3.4');
      currentRequest = req;

      await expect(controller.requestAccess()).rejects.toThrow(
        ForbiddenException,
      );
      expect(redisService.addToSet).not.toHaveBeenCalled();
    });
  });
});
