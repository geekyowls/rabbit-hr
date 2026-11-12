import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '@modules/queue/queue.module';
import { reportJobFailure } from '@modules/queue/report-job-failure';
import {
  InterviewCalendarSyncExecutor,
  isRetryableSyncError,
} from './interview-calendar-sync.executor';
import { InterviewCalendarSyncJob } from './interview-calendar-sync.types';

@Processor(QUEUE_NAMES.INTERVIEW_CALENDAR_SYNC, { concurrency: 3 })
export class InterviewCalendarSyncProcessor extends WorkerHost {
  constructor(private readonly executor: InterviewCalendarSyncExecutor) {
    super();
  }

  async process(job: Job<InterviewCalendarSyncJob>): Promise<void> {
    try {
      await this.executor.run(job.data);
    } catch (error) {
      const lastAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
      if (lastAttempt || !isRetryableSyncError(error)) {
        await this.executor.markFailed(job.data, error);
        return;
      }
      throw error;
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<InterviewCalendarSyncJob> | undefined, err: Error): void {
    reportJobFailure(job, err);
  }
}
