import { Injectable, Inject } from '@nestjs/common';
import * as Redis from 'ioredis';

@Injectable()
export class RedisCacheService {
  constructor(
    @Inject('CACHE_MANAGER') private readonly cacheManager: Redis.Redis,
  ) {}

  async setString(key: string, value: any, ttl?: number): Promise<void> {
    if (ttl) {
      await this.cacheManager.set(key, value, 'EX', ttl);
    } else {
      await this.cacheManager.set(key, value);
    }
  }

  async flushAll(): Promise<void> {
    await this.cacheManager.flushall();
  }

  async getString(key: string): Promise<any | null> {
    return await this.cacheManager.get(key);
  }

  async deleteKey(key: string): Promise<any | null> {
    return await this.cacheManager.del(key);
  }

  async setHash(
    key: string,
    field: string,
    value: any,
    ttl?: any,
  ): Promise<void> {
    await this.cacheManager.hset(key, field, value);
    if (ttl) {
      await this.cacheManager.expire(key, ttl);
    }
  }

  async setMultipleHashFields(
    key: string,
    fields: Record<string, any>,
    ttl?: number,
  ): Promise<void> {
    try {
      await this.cacheManager.hmset(key, fields);
      if (ttl) {
        await this.cacheManager.expire(key, ttl);
      }
    } catch (error) {
      console.error(`[RedisCacheService] Error setting hash fields for key ${key}:`, error);
      throw error;
    }
  }

  async deleteHash(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async deleteHashFields(key: string, fields: string[]): Promise<void> {
    await this.cacheManager.hdel(key, ...fields);
  }

  async getHash(key: string, field: string): Promise<any | null> {
    return await this.cacheManager.hget(key, field);
  }

  async getHashAll(key: string): Promise<any | null> {
    return await this.cacheManager.hgetall(key);
  }

  async setList(key: string, values: string[], ttl?: number): Promise<void> {
    await this.cacheManager.lpush(key, ...values);
    if (ttl) {
      await this.cacheManager.expire(key, ttl);
    }
  }

  async getList(key: string, start: number, end: number): Promise<string[]> {
    return await this.cacheManager.lrange(key, start, end);
  }

  async setSet(key: string, members: string[], ttl?: number): Promise<void> {
    await this.cacheManager.sadd(key, ...members);
    if (ttl) {
      await this.cacheManager.expire(key, ttl);
    }
  }

  async getSet(key: string): Promise<string[]> {
    return await this.cacheManager.smembers(key);
  }

  async setSortedSet(
    key: string,
    score: number,
    member: string,
    ttl?: number,
  ): Promise<void> {
    await this.cacheManager.zadd(key, score, member);
    if (ttl) {
      await this.cacheManager.expire(key, ttl);
    }
  }

  async getSortedSetByRank(
    key: string,
    start: number,
    stop: number,
  ): Promise<string[]> {
    return await this.cacheManager.zrange(key, start, stop);
  }

  async setHashField(hash: string, field: string, value: any): Promise<void> {
    await this.cacheManager.hset(hash, field, value);
  }

  async acquireLock(
    lockKey: string,
    lockValue: string,
    ttlSeconds: number = 60,
  ): Promise<boolean> {
    try {
      const result = await this.cacheManager.set(
        lockKey,
        lockValue,
        'PX',
        ttlSeconds * 1000,
        'NX',
      );
      return result === 'OK';
    } catch (error) {
      return false;
    }
  }

  async releaseLock(lockKey: string, lockValue: string): Promise<boolean> {
    try {
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      const result = await this.cacheManager.eval(
        script,
        1,
        lockKey,
        lockValue,
      );
      return result === 1;
    } catch (error) {
      return false;
    }
  }

  async isLocked(lockKey: string): Promise<boolean> {
    try {
      const result = await this.cacheManager.exists(lockKey);
      return result === 1;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the underlying Redis client for advanced operations
   */
  get client() {
    return this.cacheManager;
  }
}

