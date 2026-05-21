import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';
import * as crypto from 'crypto';

export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redisClient: Redis;

  onModuleInit() {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = process.env.REDIS_PORT
      ? parseInt(process.env.REDIS_PORT, 10)
      : 6379;

    this.redisClient = new Redis({ host, port });
  }

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

  private async getManagerKey(): Promise<string> {
    const keys: string[] = await this.redisClient.smembers('manager:k');
    return keys[0];
  }
}
