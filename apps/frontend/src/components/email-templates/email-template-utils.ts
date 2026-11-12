import type { PillTone } from '@/components/patterns';
import {
  EMAIL_MERGE_FIELDS,
  type EmailTemplateCategory,
} from '@/types/email-template.type';

export type MergeField = (typeof EMAIL_MERGE_FIELDS)[number];

export const CATEGORY_LABEL: Record<EmailTemplateCategory, string> = {
  invite: 'Invite',
  rejection: 'Rejection',
  offer: 'Offer',
  interview: 'Interview',
  general: 'General',
};

export const CATEGORY_TONE: Record<EmailTemplateCategory, PillTone> = {
  invite: 'info',
  rejection: 'danger',
  offer: 'success',
  interview: 'purple',
  general: 'neutral',
};

export const SAMPLE_MERGE_VALUES: Record<MergeField, string> = {
  'candidate.firstName': 'Amelia',
  'candidate.lastName': 'Hughes',
  'candidate.fullName': 'Amelia Hughes',
  'candidate.email': 'amelia.hughes@example.com',
  'job.title': 'Senior Care Assistant',
  'job.reference': 'JOB-0042',
  'job.location': 'Leeds',
  'client.name': 'Northwind Health',
  'recruiter.name': 'Oliver Bennett',
  'recruiter.firstName': 'Oliver',
  'recruiter.email': 'oliver.bennett@example.com',
  'organization.name': 'RabbitHR',
};

export const MERGE_FIELDS = EMAIL_MERGE_FIELDS;

export function mergeToken(field: MergeField) {
  return `{{${field}}}`;
}

export function renderTemplate(template: string) {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, key: string) =>
    key in SAMPLE_MERGE_VALUES ? SAMPLE_MERGE_VALUES[key as MergeField] : match,
  );
}
