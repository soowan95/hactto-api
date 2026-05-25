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

    it('localhost 환경에서는 국가 검증을 무시하고 IP 등록 및 쿠키를 발급해야 한다', async () => {
      process.env.NODE_ENV = 'localhost';
      const { req, res } = createMockReqRes('127.0.0.1');
      redisService.signAccessPayload.mockResolvedValue(
        'signed-token-localhost',
      );

      await controller.requestAccess(req, res);

      expect(redisService.addToSet).toHaveBeenCalledWith(
        'allowed:ips',
        '127.0.0.1',
      );
      expect(redisService.signAccessPayload).toHaveBeenCalled();
      expect(res.cookie).toHaveBeenCalledWith(
        'allowed_token',
        'signed-token-localhost',
        {
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        },
      );
    });

    it('프로덕션 환경에서 대한민국(KR) IP이면 등록 및 쿠키를 발급해야 한다', async () => {
      process.env.NODE_ENV = 'production';
      const { req, res } = createMockReqRes('1.2.3.4', 'KR');
      redisService.signAccessPayload.mockResolvedValue('signed-token-kr');

      await controller.requestAccess(req, res);

      expect(redisService.addToSet).toHaveBeenCalledWith(
        'allowed:ips',
        '1.2.3.4',
      );
      expect(res.cookie).toHaveBeenCalledWith(
        'allowed_token',
        'signed-token-kr',
        {
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        },
      );
    });

    it('프로덕션 환경에서 대한민국 IP가 아니면(예: US) ForbiddenException을 발생시켜야 한다', async () => {
      process.env.NODE_ENV = 'production';
      const { req, res } = createMockReqRes('1.2.3.4', 'US');

      await expect(controller.requestAccess(req, res)).rejects.toThrow(
        ForbiddenException,
      );
      expect(redisService.addToSet).not.toHaveBeenCalled();
      expect(res.cookie).not.toHaveBeenCalled();
    });

    it('프로덕션 환경에서 국가 헤더가 누락되면 ForbiddenException을 발생시켜야 한다', async () => {
      process.env.NODE_ENV = 'production';
      const { req, res } = createMockReqRes('1.2.3.4');

      await expect(controller.requestAccess(req, res)).rejects.toThrow(
        ForbiddenException,
      );
      expect(redisService.addToSet).not.toHaveBeenCalled();
      expect(res.cookie).not.toHaveBeenCalled();
    });
  });
});
