import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';
import * as crypto from 'crypto';

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

  async isJustCreated(): Promise<boolean> {
    const count: number = await this.redisClient.scard('manager:k');
    return count === 0;
  }

  async reset(): Promise<void> {
    await this.redisClient.flushdb();
  }

  async resetAll(): Promise<void> {
    await this.redisClient.flushall();
  }

  async addToSet(key: string, value: string): Promise<number> {
    const redisManagerKey: string = await this.getManagerKey();
    if (redisManagerKey === value) return 0;
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

  private async getManagerKey(): Promise<string> {
    const keys: string[] = await this.redisClient.smembers('manager:k');
    return keys[0];
  }
}
