import type { PillTone } from '@/components/patterns';
import { PAY_UNIT_LABEL } from '@/lib/format';
import type {
  EmploymentType,
  JobStatus,
  RateUnit,
  WorkMode,
} from '@/types/job.type';

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  on_hold: 'On hold',
  closed: 'Closed',
  filled: 'Filled',
};

export const JOB_STATUS_TONE: Record<JobStatus, PillTone> = {
  draft: 'info',
  published: 'success',
  on_hold: 'warning',
  closed: 'neutral',
  filled: 'purple',
};

export const JOB_STATUS_ACTION: Record<JobStatus, string> = {
  draft: 'Move to draft',
  published: 'Publish',
  on_hold: 'Put on hold',
  closed: 'Close',
  filled: 'Mark filled',
};

export const EMPLOYMENT_TYPE_LABEL: Record<EmploymentType, string> = {
  permanent: 'Permanent',
  temporary: 'Temporary',
  contract: 'Contract',
};

export const WORK_MODE_LABEL: Record<WorkMode, string> = {
  onsite: 'On site',
  hybrid: 'Hybrid',
  remote: 'Remote',
};

export const RATE_UNIT_LABEL: Record<RateUnit, string> = {
  hour: PAY_UNIT_LABEL.hour,
  day: PAY_UNIT_LABEL.day,
  year: PAY_UNIT_LABEL.year,
};

export { formatJobPay as formatPay } from '@/lib/format';

export function errorMessage(
  error: unknown,
  fallback = 'Something went wrong',
) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function nextStatusActions(status: JobStatus): JobStatus[] {
  const order: JobStatus[] = ['published', 'on_hold', 'closed', 'filled'];
  return order.filter((s) => s !== status);
}
