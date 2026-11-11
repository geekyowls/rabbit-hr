import { ConflictException } from '@nestjs/common';

export const INTEGRATION_PROVIDERS = {
  GOOGLE_CALENDAR: 'google_calendar',
  MICROSOFT: 'microsoft_teams',
  ZOOM: 'zoom',
} as const;

export type CalendarProvider =
  | typeof INTEGRATION_PROVIDERS.GOOGLE_CALENDAR
  | typeof INTEGRATION_PROVIDERS.MICROSOFT;

export const WHATSAPP_PROVIDERS = ['wappcloud', 'whatsapp'];

export interface OrganizationCapabilities {
  calendar: { google: boolean; microsoft: boolean };
  meetings: { googleMeet: boolean; zoom: boolean; teams: boolean };
  calls: boolean;
  whatsapp: boolean;
}

export interface IntegrationCapabilities extends OrganizationCapabilities {
  jobFeed: boolean;
  mailbox: { connected: boolean; provider: string | null };
}

export type CapabilityKey =
  | 'calendar'
  | 'googleCalendar'
  | 'microsoftCalendar'
  | 'googleMeet'
  | 'zoom'
  | 'teams'
  | 'calls'
  | 'whatsapp'
  | 'jobFeed'
  | 'mailbox';

export const CAPABILITY_LABELS: Record<CapabilityKey, string> = {
  calendar: 'Calendar',
  googleCalendar: 'Google Calendar',
  microsoftCalendar: 'Microsoft 365 calendar',
  googleMeet: 'Google Meet',
  zoom: 'Zoom',
  teams: 'Microsoft Teams',
  calls: 'Calling',
  whatsapp: 'WhatsApp',
  jobFeed: 'Job feed',
  mailbox: 'Mailbox',
};

export const PROVIDER_LABELS: Record<string, string> = {
  [INTEGRATION_PROVIDERS.GOOGLE_CALENDAR]: 'Google Calendar',
  [INTEGRATION_PROVIDERS.MICROSOFT]: 'Microsoft 365',
  [INTEGRATION_PROVIDERS.ZOOM]: 'Zoom',
};

export class IntegrationNotConnectedException extends ConflictException {
  constructor(label: string) {
    super(`${label} is not connected`);
  }
}
