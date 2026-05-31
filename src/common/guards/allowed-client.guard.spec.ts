import { Test, TestingModule } from '@nestjs/testing';
import { AllowedClientGuard } from './allowed-client.guard';
import { RedisService } from '../../helpers/redis/application/redis.service';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RequestParser } from '../utils/request-parser';

describe('AllowedClientGuard', () => {
  let guard: AllowedClientGuard;
  let redisService: jest.Mocked<RedisService>;
  let reflector: jest.Mocked<Reflector>;
  let currentRequest: any;

  beforeEach(async () => {
    currentRequest = null;

    const mockRedisService = {
      isMemberOfSet: jest.fn(),
      verifyAccessPayload: jest.fn(),
      addToSet: jest.fn(),
    };

    const mockReflector = {
      getAllAndOverride: jest.fn(),
    };

    const mockRequestParser = {
      getIpOrThrow: jest.fn().mockImplementation(() => {
        let ip =
          currentRequest?.headers?.['x-forwarded-for'] ||
          currentRequest?.socket?.remoteAddress;
        if (!ip) throw new ForbiddenException('IP 주소를 식별할 수 없습니다.');
        if (ip.includes(',')) ip = ip.split(',')[0].trim();
        if (ip.startsWith('::ffff:')) ip = ip.replace('::ffff:', '');
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
      providers: [
        AllowedClientGuard,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
        {
          provide: RequestParser,
          useValue: mockRequestParser,
        },
      ],
    }).compile();

    guard = module.get<AllowedClientGuard>(AllowedClientGuard);
    redisService = module.get(
      RedisService,
    ) as unknown as jest.Mocked<RedisService>;
    reflector = module.get(Reflector) as unknown as jest.Mocked<Reflector>;
  });

  const createMockContext = (
    ip: string,
    cookieHeader?: string,
    query?: any,
  ): ExecutionContext => {
    const request = {
      headers: {
        'x-forwarded-for': ip,
        cookie: cookieHeader,
      },
      socket: {
        remoteAddress: ip,
      },
      query: query || {},
    };
    currentRequest = request;
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  };

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('IP가 Redis 화이트리스트에 존재하면 true를 반환해야 한다', async () => {
    const context = createMockContext('1.2.3.4');
    redisService.isMemberOfSet.mockResolvedValue(true);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(redisService.isMemberOfSet).toHaveBeenCalledWith(
      'allowed:ips',
      '1.2.3.4',
    );
  });

  it('IP가 화이트리스트에 없고 유효한 allowed_token 쿠키가 있으면 true를 반환하고 새 IP를 Redis에 등록해야 한다', async () => {
    const context = createMockContext(
      '1.2.3.4',
      'allowed_token=valid-token-xyz',
    );
    redisService.isMemberOfSet.mockResolvedValue(false);
    redisService.verifyAccessPayload.mockResolvedValue(true);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(redisService.verifyAccessPayload).toHaveBeenCalledWith(
      'valid-token-xyz',
    );
    expect(redisService.addToSet).toHaveBeenCalledWith(
      'allowed:ips',
      '1.2.3.4',
    );
  });

  it('IP가 화이트리스트에 없고 allowed_token 쿠키가 만료/유효하지 않으면 ForbiddenException을 발생시켜야 한다', async () => {
    const context = createMockContext('1.2.3.4', 'allowed_token=invalid-token');
    redisService.isMemberOfSet.mockResolvedValue(false);
    redisService.verifyAccessPayload.mockResolvedValue(false);

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
    expect(redisService.verifyAccessPayload).toHaveBeenCalledWith(
      'invalid-token',
    );
    expect(redisService.addToSet).not.toHaveBeenCalled();
  });

  it('IP가 화이트리스트에 없고 쿠키 헤더가 없으면 ForbiddenException을 발생시켜야 한다', async () => {
    const context = createMockContext('1.2.3.4');
    redisService.isMemberOfSet.mockResolvedValue(false);

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
    expect(redisService.addToSet).not.toHaveBeenCalled();
  });

  it('visitorId가 guest이고 @GuestAllowed() 데코레이터가 설정되어 있으면 true를 반환해야 한다', async () => {
    const context = createMockContext('1.2.3.4', undefined, {
      visitorId: 'guest',
    });
    reflector.getAllAndOverride.mockReturnValue(true);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalled();
  });

  it('visitorId가 guest이지만 @GuestAllowed() 데코레이터가 설정되어 있지 않으면 ForbiddenException을 발생시켜야 한다', async () => {
    const context = createMockContext('1.2.3.4', undefined, {
      visitorId: 'guest',
    });
    reflector.getAllAndOverride.mockReturnValue(false);
    redisService.isMemberOfSet.mockResolvedValue(false);

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
    expect(reflector.getAllAndOverride).toHaveBeenCalled();
  });
});
