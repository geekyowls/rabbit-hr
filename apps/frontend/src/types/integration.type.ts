import type { PlanFeature } from '@boilerplate/shared';
export type IntegrationCategory =
  | 'calendar'
  | 'video_conferencing'
  | 'messaging'
  | 'productivity'
  | 'ai'
  | 'telephony'
  | 'payments';

export type IntegrationAuthType = 'oauth' | 'api_key';

export type IntegrationStatus =
  'connected' | 'disconnected' | 'expired' | 'error';

export interface IntegrationListItem {
  id: string;
  provider: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  category: IntegrationCategory;
  authType: IntegrationAuthType;
  isConnected: boolean;
  isConfigured: boolean;
  accountEmail?: string | null;
  accountName?: string | null;
  connectedAt?: string;
  status?: IntegrationStatus;
  errorMessage?: string | null;
  webhookToken?: string | null;
  planFeature: PlanFeature | null;
}

export interface SaveCredentialsResponse {
  status: IntegrationStatus;
  errorMessage: string | null;
  webhookToken?: string | null;
}

export interface HealthCheckResponse {
  ok: boolean;
  status: IntegrationStatus;
  errorMessage: string | null;
}
