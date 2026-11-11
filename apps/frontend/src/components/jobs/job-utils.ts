import type { PillTone } from '@/components/patterns';
import type {
  EmploymentType,
  Job,
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
  hour: 'per hour',
  day: 'per day',
  year: 'per year',
};

export function formatMoney(amount: number, currency: string = 'GBP') {
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

type PayFields = Pick<
  Job,
  | 'employmentType'
  | 'salaryMin'
  | 'salaryMax'
  | 'payRate'
  | 'rateUnit'
  | 'currency'
>;

export function formatPay(job: PayFields): string {
  const currency = job.currency || 'GBP';
  const isPermanent = job.employmentType === 'permanent';
  const unit = job.rateUnit ?? (isPermanent ? 'year' : 'hour');
  const suffix = RATE_UNIT_LABEL[unit];
  if (!isPermanent && job.payRate != null) {
    return `${formatMoney(Number(job.payRate), currency)} ${suffix}`;
  }
  const min = job.salaryMin != null ? Number(job.salaryMin) : null;
  const max = job.salaryMax != null ? Number(job.salaryMax) : null;
  if (min != null && max != null && min !== max) {
    return `${formatMoney(min, currency)} to ${formatMoney(max, currency)} ${suffix}`;
  }
  const single = min ?? max;
  if (single != null) return `${formatMoney(single, currency)} ${suffix}`;
  if (job.payRate != null) {
    return `${formatMoney(Number(job.payRate), currency)} ${suffix}`;
  }
  return 'Not set';
}

export function formatShortDate(value: string | null | undefined) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

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
