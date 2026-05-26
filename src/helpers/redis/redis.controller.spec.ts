import { Test, TestingModule } from '@nestjs/testing';
import { RedisController } from './redis.controller';
import { RedisService } from './redis.service';
import { Request, Response } from 'express';
import { ForbiddenException } from '@nestjs/common';

describe('RedisController', () => {
  let controller: RedisController;
  let redisService: jest.Mocked<RedisService>;

  beforeEach(async () => {
    const mockRedisService = {
      addToSet: jest.fn(),
      signAccessPayload: jest.fn(),
      generateMasterKey: jest.fn(),
      getFromSet: jest.fn(),
      removeFromSet: jest.fn(),
      reset: jest.fn(),
      resetAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RedisController],
      providers: [
        {
          provide: RedisService,
          useValue: mockRedisService,
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

      await controller.requestAccess(req);

      expect(redisService.addToSet).toHaveBeenCalledWith(
        'pending:ips',
        '127.0.0.1',
      );
    });

    it('프로덕션 환경에서 대한민국(KR) IP이면 대기열(pending:ips)에 IP를 등록해야 한다', async () => {
      process.env.NODE_ENV = 'production';
      const { req } = createMockReqRes('1.2.3.4', 'KR');

      await controller.requestAccess(req);

      expect(redisService.addToSet).toHaveBeenCalledWith(
        'pending:ips',
        '1.2.3.4',
      );
    });

    it('프로덕션 환경에서 대한민국 IP가 아니면(예: US) ForbiddenException을 발생시켜야 한다', async () => {
      process.env.NODE_ENV = 'production';
      const { req } = createMockReqRes('1.2.3.4', 'US');

      await expect(controller.requestAccess(req)).rejects.toThrow(
        ForbiddenException,
      );
      expect(redisService.addToSet).not.toHaveBeenCalled();
    });

    it('프로덕션 환경에서 국가 헤더가 누락되면 ForbiddenException을 발생시켜야 한다', async () => {
      process.env.NODE_ENV = 'production';
      const { req } = createMockReqRes('1.2.3.4');

      await expect(controller.requestAccess(req)).rejects.toThrow(
        ForbiddenException,
      );
      expect(redisService.addToSet).not.toHaveBeenCalled();
    });
  });
});
