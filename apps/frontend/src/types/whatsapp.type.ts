import type { UserSummary } from './common.type';

export type WhatsappVariableSource =
  { type: 'placeholder'; key: string } | { type: 'text'; value: string };

export type WhatsappMessageStatus = 'queued' | 'sent' | 'failed';

export interface WhatsappTemplate {
  id: string;
  organizationId: string;
  provider: string;
  name: string;
  language: string;
  category: string | null;
  status: string | null;
  body: string | null;
  variableKeys: string[];
  mapping: Record<string, WhatsappVariableSource>;
  label: string | null;
  availableAtProvider: boolean;
  addedManually: boolean;
  unsupportedReason: string | null;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsappTemplatesResponse {
  connected: boolean;
  provider: string | null;
  templates: WhatsappTemplate[];
}

export interface WhatsappPlaceholder {
  key: string;
  label: string;
  group: string;
  needs: Array<'application'>;
}

export interface AddWhatsappTemplateRequest {
  name: string;
  language?: string;
  body: string;
  headerText?: string;
}

export interface UpdateWhatsappTemplateMappingRequest {
  mapping: Record<string, WhatsappVariableSource | null>;
  label?: string;
}

export interface WhatsappMessageRequest {
  templateId: string;
  candidateId: string;
  applicationId?: string;
}

export interface WhatsappPreview {
  variables: Record<string, string>;
  missing: { key: string; label: string }[];
  body: string | null;
  phone: string | null;
}

export interface WhatsappMessage {
  id: string;
  organizationId: string;
  provider: string;
  templateId: string | null;
  templateName: string;
  candidateId: string;
  applicationId: string | null;
  phone: string;
  variables: Record<string, string>;
  renderedBody: string | null;
  status: WhatsappMessageStatus;
  errorCategory: string | null;
  errorMessage: string | null;
  providerMessageId: string | null;
  sentBy: string | null;
  sentAt: string | null;
  sender?: UserSummary | null;
  application?: {
    id: string;
    jobId: string;
    job: { id: string; title: string; reference: string } | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListCandidateWhatsappMessagesParams {
  page: number;
  limit: number;
}
