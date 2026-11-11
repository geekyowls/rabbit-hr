import {
  EMPLOYMENT_TYPE_LABEL,
  WORK_MODE_LABEL,
  formatPay,
} from '@/components/jobs/job-utils';
import type {
  CareersCvExtension,
  CareersJobListItem,
} from '@/types/careers.type';

export { EMPLOYMENT_TYPE_LABEL, WORK_MODE_LABEL };

export const CV_MIME_TYPES: Record<CareersCvExtension, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

export function careersPay(job: CareersJobListItem) {
  const pay = formatPay({ ...job, currency: job.currency || 'GBP' });
  return pay === 'Not set' ? null : pay;
}

export function postedLabel(publishedAt: string | null) {
  if (!publishedAt) return null;
  const posted = new Date(publishedAt);
  if (Number.isNaN(posted.getTime())) return null;
  const days = Math.floor((Date.now() - posted.getTime()) / 86_400_000);
  if (days <= 0) return 'Posted today';
  if (days === 1) return 'Posted yesterday';
  if (days < 30) return `Posted ${days} days ago`;
  return `Posted ${posted.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

export function formatClosingDate(closingDate: string | null) {
  if (!closingDate) return null;
  const date = new Date(closingDate);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function cvExtension(fileName: string): CareersCvExtension | null {
  const ext = fileName.split('.').pop()?.toLowerCase();
  return ext === 'pdf' || ext === 'doc' || ext === 'docx' ? ext : null;
}

export function careersJobHref(orgSlug: string, jobId: string) {
  return `/careers/job?org=${encodeURIComponent(orgSlug)}&id=${encodeURIComponent(jobId)}`;
}

export function careersListHref(orgSlug: string) {
  return `/careers?org=${encodeURIComponent(orgSlug)}`;
}
