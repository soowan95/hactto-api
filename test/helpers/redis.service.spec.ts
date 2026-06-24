import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from '../../src/helpers/redis/application/redis.service';
import * as crypto from 'crypto';

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

  describe('validateMasterKey', () => {
    const secret = 'JBSWY3DPEHPK3PXP';

    beforeEach(() => {
      process.env.ADMIN_OTP_SECRET = secret;
    });

    function testDecodeBase32(base32: string): Buffer {
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
      const cleanBase32 = base32.toUpperCase().replace(/=+$/, '');
      let bits = 0;
      let value = 0;
      const buffer: number[] = [];
      for (let i = 0; i < cleanBase32.length; i++) {
        const idx = alphabet.indexOf(cleanBase32[i]);
        if (idx === -1) throw new Error('Invalid Base32 character');
        value = (value << 5) | idx;
        bits += 5;
        if (bits >= 8) {
          buffer.push((value >> (bits - 8)) & 255);
          bits -= 8;
        }
      }
      return Buffer.from(buffer);
    }

    function testGenerateTOTP(secretKey: string, counter: number): string {
      const key = testDecodeBase32(secretKey);
      const buffer = Buffer.alloc(8);
      buffer.writeBigInt64BE(BigInt(counter), 0);
      const hmac = crypto.createHmac('sha1', key).update(buffer).digest();
      const offset = hmac[hmac.length - 1] & 0xf;
      const code =
        ((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff);
      const otp = code % 1000000;
      return otp.toString().padStart(6, '0');
    }

    it('올바른 구글 OTP 번호인 경우 검증에 성공해야 한다', async () => {
      const epoch = Math.floor(Date.now() / 1000);
      const counter = Math.floor(epoch / 30);
      const validOtp = testGenerateTOTP(secret, counter);

      const isValid = await service.validateMasterKey(validOtp);
      expect(isValid).toBe(true);
    });

    it('시간이 만료된 OTP 번호인 경우 검증에 실패해야 한다', async () => {
      const epoch = Math.floor(Date.now() / 1000) - 90;
      const counter = Math.floor(epoch / 30);
      const expiredOtp = testGenerateTOTP(secret, counter);

      const isValid = await service.validateMasterKey(expiredOtp);
      expect(isValid).toBe(false);
    });

    it('형식이 올바르지 않거나 잘못된 OTP 번호인 경우 검증에 실패해야 한다', async () => {
      const isValid = await service.validateMasterKey('999999');
      expect(isValid).toBe(false);
    });
  });
});
