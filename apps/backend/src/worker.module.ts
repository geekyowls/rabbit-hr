import { Module } from '@nestjs/common';
import { SentryModule } from '@sentry/nestjs/setup';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/db.module';
import { QueueModule } from './modules/queue/queue.module';
import { NotificationsCoreModule } from './modules/user-notifications/notifications-core.module';
import { MailboxWorkerModule } from './modules/mailbox/mailbox-worker.module';
import { IntegrationCoreModule } from './modules/integration/core/integration-core.module';
import { InterviewCalendarSyncWorkerModule } from './modules/interview-calendar-sync/interview-calendar-sync-worker.module';
import { CallWorkerModule } from './modules/call/call-worker.module';
import { WhatsappWorkerModule } from './modules/whatsapp/whatsapp-worker.module';
import { BillingCoreModule } from './modules/billing/core/billing-core.module';

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
    MailboxWorkerModule,
    IntegrationCoreModule.forWorker(),
    InterviewCalendarSyncWorkerModule,
    CallWorkerModule,
    WhatsappWorkerModule,
    BillingCoreModule,
  ],
})
export class WorkerModule {}
