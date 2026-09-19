import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RedisCacheService } from '@boilerplate/core';

export interface ServiceHealth {
  status: 'up' | 'down';
  latency?: number;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
  };
}

@Injectable()
export class AppService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly redisCacheService: RedisCacheService,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getHealth(): Promise<HealthResponse> {
    const [database, redis] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const allUp = database.status === 'up' && redis.status === 'up';
    const anyDown = database.status === 'down';

    return {
      status: anyDown ? 'unhealthy' : allUp ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: { database, redis },
    };
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'up', latency: Date.now() - start };
    } catch {
      return { status: 'down' };
    }
  }

  private async checkRedis(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      await this.redisCacheService.client.ping();
      return { status: 'up', latency: Date.now() - start };
    } catch {
      return { status: 'down' };
    }
  }
}
