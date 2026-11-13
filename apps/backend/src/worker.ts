import './instrument';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { WorkerModule } from './worker.module';
import { JsonLogger } from './modules/shared/framework/json-logger';
import { assertProductionEnv } from './modules/shared/framework/production-env';

async function bootstrap() {
  assertProductionEnv('worker');
  process.env.RUN_MIGRATIONS = 'false';
  const app = await NestFactory.createApplicationContext(WorkerModule, {
    logger:
      process.env.NODE_ENV === 'production'
        ? new JsonLogger()
        : ['log', 'error', 'warn'],
  });
  const logger = new Logger('Worker');
  logger.log('Worker started, consuming queues');

  const shutdown = async (signal: string) => {
    logger.log(`Received ${signal}, shutting down...`);
    await app.close();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  const logger = new Logger('Worker');
  logger.error('Worker failed to start', err);
  process.exit(1);
});
