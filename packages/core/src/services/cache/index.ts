import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';
import { RedisCacheService } from './redis-cache.service';

export const cacheManagerProvider = {
  provide: 'CACHE_MANAGER',
  useFactory: (configService: ConfigService): Redis => {
    const host = configService.get<string>('REDIS_HOST') || 'localhost';
    const port = configService.get<number>('REDIS_PORT') || 6379;
    const password = configService.get<string>('REDIS_PASSWORD');
    const db = configService.get<number>('REDIS_DB');

    console.log('[Redis] Connecting to Redis:', { host, port, db });

    const redisOptions: RedisOptions = {
      host,
      port,
      ...(password && { password }),
      ...(db !== undefined && { db }),
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      lazyConnect: false,
    };

    const redis = new Redis(redisOptions);

    redis.on('connect', () => {
      console.log('[Redis] Connected successfully');
    });

    redis.on('error', (error) => {
      console.error('[Redis] Connection error:', error);
    });

    redis.on('ready', () => {
      console.log('[Redis] Ready to accept commands');
    });

    return redis;
  },
  inject: [ConfigService],
};

export const redisCacheService = {
  provide: RedisCacheService,
  useClass: RedisCacheService,
};

export { RedisCacheService };
