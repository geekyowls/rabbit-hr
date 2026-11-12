export type EmailTemplateCategory =
  'invite' | 'rejection' | 'offer' | 'interview' | 'general';

export const EMAIL_TEMPLATE_CATEGORIES: EmailTemplateCategory[] = [
  'invite',
  'rejection',
  'offer',
  'interview',
  'general',
];

export const EMAIL_MERGE_FIELDS = [
  'candidate.firstName',
  'candidate.lastName',
  'candidate.fullName',
  'candidate.email',
  'job.title',
  'job.reference',
  'job.location',
  'client.name',
  'recruiter.name',
  'recruiter.firstName',
  'recruiter.email',
  'organization.name',
] as const;

export interface EmailTemplate {
  id: string;
  organizationId: string;
  name: string;
  category: EmailTemplateCategory;
  subject: string;
  body: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmailTemplateRequest {
  name: string;
  category?: EmailTemplateCategory;
  subject: string;
  body: string;
  isDefault?: boolean;
}

export type UpdateEmailTemplateRequest = Partial<CreateEmailTemplateRequest>;

export interface SendApplicationEmailRequest {
  templateId?: string;
  subject?: string;
  body?: string;
}

export interface SendApplicationEmailResponse {
  sent: boolean;
  reason: string | null;
  to: string;
  subject: string;
  body: string;
  activityId: string;
}
