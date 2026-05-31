import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';

jest.mock('ioredis', () => {
  const store = new Map<string, string>();
  const mockRedisInstance = {
    get: jest.fn().mockImplementation(async (key) => store.get(key) || null),
    set: jest.fn().mockImplementation(async (key, value) => {
      store.set(key, value);
      return 'OK';
    }),
    sadd: jest.fn().mockResolvedValue(1),
    srem: jest.fn().mockResolvedValue(1),
    sismember: jest.fn().mockResolvedValue(1),
    smembers: jest.fn().mockResolvedValue([]),
    disconnect: jest.fn(),
  };
  return {
    Redis: jest.fn().mockImplementation(() => mockRedisInstance),
  };
});

describe('RedisService', () => {
  let service: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RedisService],
    }).compile();

    service = module.get<RedisService>(RedisService);
    // 수동으로 생명주기 훅 호출하여 ioredis 모의 인스턴스 초기화
    service.onModuleInit();
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('cookie secret을 동적으로 생성하고 동일하게 유지해야 한다', async () => {
    const secret1 = await service.getCookieSecret();
    const secret2 = await service.getCookieSecret();

    expect(secret1).toBeDefined();
    expect(secret1.length).toBeGreaterThan(0);
    expect(secret1).toBe(secret2);
  });

  it('액세스 페이로드를 올바르게 서명하고 해독 검증해야 한다', async () => {
    const token = await service.signAccessPayload();
    expect(token).toContain('.');

    const isValid = await service.verifyAccessPayload(token);
    expect(isValid).toBe(true);
  });

  it('토큰의 일부분이 변조되면 유효하지 않아야 한다', async () => {
    const token = await service.signAccessPayload();
    const parts = token.split('.');
    const tamperedToken = parts[0] + 'tampered.' + parts[1];

    const isValid = await service.verifyAccessPayload(tamperedToken);
    expect(isValid).toBe(false);
  });

  it('형식이 올바르지 않은 토큰은 유효하지 않아야 한다', async () => {
    const isValid = await service.verifyAccessPayload('invalidtokenstring');
    expect(isValid).toBe(false);
  });
});
