export interface IntegrationCapabilities {
  calendar: { google: boolean; microsoft: boolean };
  meetings: { googleMeet: boolean; zoom: boolean; teams: boolean };
  calls: boolean;
  whatsapp: boolean;
  jobFeed: boolean;
  mailbox: { connected: boolean; provider: string | null };
}

export type IntegrationCapabilityKey =
  | 'calendar'
  | 'googleCalendar'
  | 'microsoftCalendar'
  | 'meetings'
  | 'googleMeet'
  | 'zoom'
  | 'teams'
  | 'calls'
  | 'whatsapp'
  | 'jobFeed'
  | 'mailbox';
