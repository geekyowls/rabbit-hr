import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '@modules/queue/queue.module';
import { reportJobFailure } from '@modules/queue/report-job-failure';
import { MailboxSyncJobData } from './mailbox.constants';
import {
  MailboxSyncOutcome,
  MailboxSyncService,
} from './services/mailbox-sync.service';

@Processor(QUEUE_NAMES.MAILBOX_SYNC, { concurrency: 3 })
export class MailboxSyncProcessor extends WorkerHost {
  constructor(private readonly syncService: MailboxSyncService) {
    super();
  }

  process(job: Job<MailboxSyncJobData>): Promise<MailboxSyncOutcome> {
    return this.syncService.sync(job.data.connectionId);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<MailboxSyncJobData> | undefined, err: Error): void {
    reportJobFailure(job, err);
  }
}
