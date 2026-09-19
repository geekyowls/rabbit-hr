import { Module } from '@nestjs/common';
import { SentryModule } from '@sentry/nestjs/setup';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/db.module';
import { QueueModule } from './modules/queue/queue.module';
import { NotificationsCoreModule } from './modules/user-notifications/notifications-core.module';

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    DatabaseModule,
    QueueModule,
    NotificationsCoreModule,
  ],
})
export class WorkerModule {}
