import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const QUEUE_NAMES = {
  HEALTH_INGEST: 'health-ingest',
  DATA_EXPORT: 'data-export',
  RULE_EVAL: 'rule-eval',
  RULE_ACTION: 'rule-action',
  INTERVIEW_CALENDAR_SYNC: 'interview-calendar-sync',
  MAILBOX_SYNC: 'mailbox-sync',
  CALL_RECORDING: 'call-recording',
  WHATSAPP_SEND: 'whatsapp-send',
} as const;

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST') || 'localhost',
          port: config.get<number>('REDIS_PORT') || 6379,
          password: config.get<string>('REDIS_PASSWORD') || undefined,
          db: config.get<number>('REDIS_DB'),
          maxRetriesPerRequest: null,
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5_000 },
          removeOnComplete: { count: 1_000, age: 24 * 3600 },
          removeOnFail: { count: 5_000, age: 7 * 24 * 3600 },
        },
      }),
    }),
    BullModule.registerQueue({ name: QUEUE_NAMES.HEALTH_INGEST }),
    BullModule.registerQueue({ name: QUEUE_NAMES.DATA_EXPORT }),
    BullModule.registerQueue({ name: QUEUE_NAMES.RULE_EVAL }),
    BullModule.registerQueue({ name: QUEUE_NAMES.RULE_ACTION }),
    BullModule.registerQueue({ name: QUEUE_NAMES.INTERVIEW_CALENDAR_SYNC }),
    BullModule.registerQueue({ name: QUEUE_NAMES.MAILBOX_SYNC }),
    BullModule.registerQueue({ name: QUEUE_NAMES.CALL_RECORDING }),
    BullModule.registerQueue({ name: QUEUE_NAMES.WHATSAPP_SEND }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
