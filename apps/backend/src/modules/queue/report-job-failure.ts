import * as Sentry from '@sentry/nestjs';
import type { Job } from 'bullmq';

export function reportJobFailure(job: Job | undefined, err: Error): void {
  const maxAttempts = job?.opts?.attempts ?? 1;
  const isFinalAttempt = (job?.attemptsMade ?? 0) >= maxAttempts;
  if (!isFinalAttempt) return;

  Sentry.captureException(err, {
    tags: { queue: job?.queueName, job: job?.name },
    extra: {
      jobId: job?.id,
      attemptsMade: job?.attemptsMade,
      organizationId: (job?.data as { organizationId?: string })
        ?.organizationId,
    },
  });
}
