import {
  EMPLOYMENT_TYPE_LABEL,
  WORK_MODE_LABEL,
} from '@/components/jobs/job-utils';
import { browserLocale, formatDateLong, formatJobPay } from '@/lib/format';
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
  const pay = formatJobPay(job, browserLocale());
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
  return `Posted ${formatDateLong(posted, { locale: browserLocale() })}`;
}

export function formatClosingDate(closingDate: string | null) {
  if (!closingDate) return null;
  return (
    formatDateLong(
      closingDate,
      { locale: browserLocale() },
      { day: 'numeric', month: 'long', year: 'numeric' },
    ) || null
  );
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
