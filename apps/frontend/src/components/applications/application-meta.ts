import {
  FILE_EXTENSION_TO_MIME_TYPE,
  UPLOAD_TYPE_ALLOWED_EXTENSIONS,
  UploadTypesEnum,
} from '@boilerplate/shared';
import type { PillTone } from '@/components/patterns';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';
import type { ApplicationStage } from '@/types/application.type';
import type { CandidateSource, RightToWork } from '@/types/candidate.type';
import type { UserSummary } from '@/types/common.type';
import type {
  DocumentType,
  DocumentVerificationStatus,
} from '@/types/document.type';

export const ACTIVE_STAGES: ApplicationStage[] = [
  'applied',
  'screening',
  'interview',
  'offer',
  'placed',
];

export const CLOSED_STAGES: ApplicationStage[] = ['rejected', 'withdrawn'];

export const STAGE_LABEL: Record<ApplicationStage, string> = {
  applied: 'Applied',
  screening: 'Screening',
  interview: 'Interview',
  offer: 'Offer',
  placed: 'Placed',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export const STAGE_TONE: Record<ApplicationStage, PillTone> = {
  applied: 'neutral',
  screening: 'info',
  interview: 'warning',
  offer: 'purple',
  placed: 'success',
  rejected: 'danger',
  withdrawn: 'neutral',
};

export const STAGE_COLOR: Record<ApplicationStage, string> = {
  applied: '#a1a1aa',
  screening: '#8FBFA1',
  interview: '#4C6EF5',
  offer: '#E0A458',
  placed: '#3F6650',
  rejected: '#E0533D',
  withdrawn: '#71717a',
};

export const STAGE_SLA_DAYS: Record<ApplicationStage, number> = {
  applied: 5,
  screening: 4,
  interview: 7,
  offer: 5,
  placed: 999,
  rejected: 999,
  withdrawn: 999,
};

export const SOURCE_LABEL: Record<CandidateSource, string> = {
  careers_page: 'Careers page',
  linkedin: 'LinkedIn',
  indeed: 'Indeed',
  reed: 'Reed',
  totaljobs: 'Totaljobs',
  cv_library: 'CV-Library',
  referral: 'Referral',
  agency_database: 'Agency database',
  other: 'Other',
};

export const RIGHT_TO_WORK_LABEL: Record<RightToWork, string> = {
  unknown: 'Unknown',
  uk_citizen: 'UK citizen',
  settled_status: 'Settled status',
  visa_sponsorship_required: 'Needs sponsorship',
  work_visa: 'Work visa',
};

export const RIGHT_TO_WORK_TONE: Record<RightToWork, PillTone> = {
  unknown: 'neutral',
  uk_citizen: 'success',
  settled_status: 'success',
  visa_sponsorship_required: 'warning',
  work_visa: 'info',
};

export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  cv: 'CV',
  id: 'ID',
  right_to_work: 'Right to work',
  reference: 'Reference',
  certificate: 'Certificate',
  dbs: 'DBS',
  other: 'Other',
};

export const VERIFICATION_TONE: Record<DocumentVerificationStatus, PillTone> = {
  pending: 'warning',
  verified: 'success',
  rejected: 'danger',
};

export const VERIFICATION_LABEL: Record<DocumentVerificationStatus, string> = {
  pending: 'Pending',
  verified: 'Verified',
  rejected: 'Rejected',
};

export function personName(
  person: { firstName: string | null; lastName: string | null } | null,
) {
  if (!person) return '';
  return [person.firstName, person.lastName].filter(Boolean).join(' ');
}

export function userLabel(user: UserSummary | null | undefined) {
  if (!user) return '';
  return personName(user) || user.email;
}

export function daysSince(date: string | null | undefined) {
  if (!date) return 0;
  const diff = Date.now() - new Date(date).getTime();
  return Math.max(0, Math.floor(diff / 86_400_000));
}

export function shortDate(date: string | null | undefined) {
  if (!date) return '-';
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return '-';
  return value.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function relativeTime(date: string) {
  const days = daysSince(date);
  if (days === 0) {
    const minutes = Math.floor(
      (Date.now() - new Date(date).getTime()) / 60_000,
    );
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  }
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return shortDate(date);
}

export function formatGbp(amount: number | null | undefined) {
  if (amount === null || amount === undefined) return '';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function errorMessage(err: unknown, fallback = 'Something went wrong') {
  return err instanceof Error && err.message ? err.message : fallback;
}

export interface UploadedFile {
  key: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export const UPLOAD_ACCEPT = '.pdf,.doc,.docx,.txt';
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export async function uploadDocumentFile(file: File): Promise<UploadedFile> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('File must be 10MB or smaller');
  }
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (
    !UPLOAD_TYPE_ALLOWED_EXTENSIONS[UploadTypesEnum.DOCUMENT].includes(
      extension,
    )
  ) {
    throw new Error('Upload a PDF, Word or text document');
  }
  const mimeType =
    FILE_EXTENSION_TO_MIME_TYPE[extension] ??
    (file.type || 'application/octet-stream');
  const { signedUrl, key } = await fetchApi<{
    signedUrl: string;
    path: string;
    key: string;
  }>(
    `${API_ROUTES.STORAGE.UPLOAD_URL}?extension=${encodeURIComponent(extension)}&type=${UploadTypesEnum.DOCUMENT}`,
  );
  const response = await fetch(signedUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': mimeType },
  });
  if (!response.ok) throw new Error('File upload failed');
  return {
    key,
    fileName: file.name,
    mimeType,
    sizeBytes: file.size,
  };
}
