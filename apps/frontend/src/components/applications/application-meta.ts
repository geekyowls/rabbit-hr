import {
  FILE_EXTENSION_TO_MIME_TYPE,
  UPLOAD_TYPE_ALLOWED_EXTENSIONS,
  UploadTypesEnum,
} from '@boilerplate/shared';
import type { PillTone } from '@/components/patterns';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';
import { useMemo } from 'react';
import { usePipelineStagesQuery } from '@/hooks/queries/use-pipeline-stages-query';
import type { ApplicationStage } from '@/types/application.type';
import {
  CLOSED_STAGE_CATEGORIES,
  type PipelineStageCategory,
} from '@/types/pipeline-stage.type';
import type { CandidateSource, RightToWork } from '@/types/candidate.type';
import type { UserSummary } from '@/types/common.type';
import type {
  DocumentType,
  DocumentVerificationStatus,
} from '@/types/document.type';

export const CATEGORY_TONE: Record<PipelineStageCategory, PillTone> = {
  applied: 'neutral',
  screening: 'info',
  interview: 'warning',
  offer: 'purple',
  hired: 'success',
  rejected: 'danger',
  withdrawn: 'neutral',
};

export const CATEGORY_SLA_DAYS: Record<PipelineStageCategory, number> = {
  applied: 5,
  screening: 4,
  interview: 7,
  offer: 5,
  hired: 999,
  rejected: 999,
  withdrawn: 999,
};

const COLOR_TOKEN_HEX: Record<string, string> = {
  slate: '#a1a1aa',
  zinc: '#71717a',
  gray: '#9ca3af',
  blue: '#8FBFA1',
  sky: '#38bdf8',
  indigo: '#6366f1',
  violet: '#4C6EF5',
  purple: '#8B7DD8',
  pink: '#ec4899',
  amber: '#E0A458',
  orange: '#f97316',
  yellow: '#eab308',
  teal: '#14b8a6',
  green: '#16a34a',
  emerald: '#3F6650',
  red: '#E0533D',
  rose: '#E0533D',
};

export const STAGE_COLOR_TOKENS = [
  'slate',
  'blue',
  'sky',
  'indigo',
  'violet',
  'purple',
  'pink',
  'amber',
  'orange',
  'yellow',
  'teal',
  'emerald',
  'rose',
];

export const STAGE_CATEGORY_LABEL: Record<PipelineStageCategory, string> = {
  applied: 'Applied',
  screening: 'Screening',
  interview: 'Interview',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

const CATEGORY_FALLBACK_COLOR: Record<PipelineStageCategory, string> = {
  applied: COLOR_TOKEN_HEX.slate,
  screening: COLOR_TOKEN_HEX.blue,
  interview: COLOR_TOKEN_HEX.violet,
  offer: COLOR_TOKEN_HEX.amber,
  hired: COLOR_TOKEN_HEX.emerald,
  rejected: COLOR_TOKEN_HEX.rose,
  withdrawn: COLOR_TOKEN_HEX.zinc,
};

export type StageLike = { color: string; category: PipelineStageCategory };

export function stageColor(stage: StageLike) {
  if (stage.color.startsWith('#')) return stage.color;
  return (
    COLOR_TOKEN_HEX[stage.color] ?? CATEGORY_FALLBACK_COLOR[stage.category]
  );
}

export function stageTone(stage: Pick<StageLike, 'category'> | undefined) {
  return stage ? CATEGORY_TONE[stage.category] : 'neutral';
}

export function isClosedCategory(category: PipelineStageCategory) {
  return CLOSED_STAGE_CATEGORIES.includes(category);
}

export function humanizeStageKey(key: string) {
  const text = key.replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function usePipelineStageMeta(enabled: boolean = true) {
  const { data, isLoading } = usePipelineStagesQuery(enabled);
  return useMemo(() => {
    const all = data ?? [];
    const stages = all.filter((s) => s.isActive);
    const byKey = new Map(all.map((s) => [s.key, s]));
    const flowStages = stages.filter((s) => !isClosedCategory(s.category));
    const closedStages = stages.filter((s) => isClosedCategory(s.category));
    const firstOf = (category: PipelineStageCategory) =>
      stages.find((s) => s.category === category)?.key;
    return {
      stages,
      flowStages,
      closedStages,
      byKey,
      isLoading,
      initialKey: firstOf('applied') ?? stages[0]?.key,
      rejectKey: firstOf('rejected'),
      label: (key: ApplicationStage) =>
        byKey.get(key)?.name ?? humanizeStageKey(key),
      tone: (key: ApplicationStage) => stageTone(byKey.get(key)),
      color: (key: ApplicationStage) => {
        const stage = byKey.get(key);
        return stage ? stageColor(stage) : COLOR_TOKEN_HEX.slate;
      },
      category: (key: ApplicationStage) => byKey.get(key)?.category,
      isRejected: (key: ApplicationStage) =>
        byKey.get(key)?.category === 'rejected',
    };
  }, [data, isLoading]);
}

export type PipelineStageMeta = ReturnType<typeof usePipelineStageMeta>;

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
  uk_citizen: 'Citizen',
  settled_status: 'Permanent resident',
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
  right_to_work: 'Work eligibility',
  reference: 'Reference',
  certificate: 'Certificate',
  dbs: 'Background check',
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

export { daysSince } from '@/lib/format';

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
