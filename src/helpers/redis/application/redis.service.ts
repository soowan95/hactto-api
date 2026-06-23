import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';
import * as crypto from 'crypto';

// Base32 Decoder for TOTP Secret Key
function decodeBase32(base32: string): Buffer {
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

// Generate Standard TOTP (SHA1, 6 digits)
function generateTOTP(secret: string, counter: number): string {
  const key = decodeBase32(secret);
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

export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redisClient: Redis;

  constructor() {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = process.env.REDIS_PORT
      ? parseInt(process.env.REDIS_PORT, 10)
      : 6379;

    this.redisClient = new Redis({ host, port });
  }

  onModuleInit() {}

  onModuleDestroy() {
    this.redisClient.disconnect();
  }

  async validateMasterKey(masterKey: string): Promise<boolean> {
    if (!masterKey) return false;

    // 1. Check Redis session cache
    const sessionKey = `manager:session:${masterKey}`;
    const isSessionValid = await this.redisClient.get(sessionKey);
    if (isSessionValid === 'true') return true;

    // 2. Verify as 6-digit OTP code format
    if (!/^\d{6}$/.test(masterKey)) return false;

    const secret = process.env.ADMIN_OTP_SECRET || 'JBSWY3DPEHPK3PXP';

    // 3. Verify TOTP with ±1 step window to allow time sync issues
    const epoch = Math.floor(Date.now() / 1000);
    const currentCounter = Math.floor(epoch / 30);

    for (let i = -1; i <= 1; i++) {
      try {
        const expectedOtp = generateTOTP(secret, currentCounter + i);
        if (expectedOtp === masterKey) {
          // 4. Save session in Redis for 1 hour (3600s)
          await this.redisClient.set(sessionKey, 'true', 'EX', 3600);
          return true;
        }
      } catch {
        // Ignore base32 decode errors or other failures
      }
    }

    return false;
  }

  async reset(): Promise<void> {
    await this.redisClient.flushdb();
  }

  async resetAll(): Promise<void> {
    await this.redisClient.flushall();
  }

  async addToSet(key: string, value: string): Promise<number> {
    return this.redisClient.sadd(key, value);
  }

  async removeFromSet(key: string, value: string): Promise<number> {
    return this.redisClient.srem(key, value);
  }

  async isMemberOfSet(key: string, value: string): Promise<boolean> {
    const result: number = await this.redisClient.sismember(key, value);
    return result == 1;
  }

  async generateMasterKey(): Promise<string> {
    return crypto.randomBytes(32).toString('base64url');
  }

  async getFromSet(key: string): Promise<string[]> {
    return await this.redisClient.smembers(key);
  }

  async getCookieSecret(): Promise<string> {
    let secret = await this.redisClient.get('config:cookie_secret');
    if (!secret) {
      secret = crypto.randomBytes(32).toString('hex');
      await this.redisClient.set('config:cookie_secret', secret);
    }
    return secret;
  }

  async signAccessPayload(): Promise<string> {
    const payload = JSON.stringify({
      allowed: true,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });
    const base64Payload = Buffer.from(payload).toString('base64url');
    const secret = await this.getCookieSecret();
    const signature = crypto
      .createHmac('sha256', secret)
      .update(base64Payload)
      .digest('base64url');
    return `${base64Payload}.${signature}`;
  }

  async verifyAccessPayload(token: string): Promise<boolean> {
    try {
      const parts = token.split('.');
      if (parts.length !== 2) return false;
      const [base64Payload, signature] = parts;
      const secret = await this.getCookieSecret();
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(base64Payload)
        .digest('base64url');

      const isSignatureValid = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      );
      if (!isSignatureValid) return false;

      const payloadStr = Buffer.from(base64Payload, 'base64url').toString(
        'utf8',
      );
      const payload = JSON.parse(payloadStr);

      if (!payload.allowed || typeof payload.exp !== 'number') return false;
      return Date.now() <= payload.exp;
    } catch {
      return false;
    }
  }

  async get(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.redisClient.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.redisClient.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.redisClient.del(key);
  }
}
