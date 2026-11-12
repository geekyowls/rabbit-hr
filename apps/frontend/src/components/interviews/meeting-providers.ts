import {
  hasIntegrationCapability,
  useIntegrationCapabilities,
} from '@/hooks/queries';
import type { IntegrationCapabilityKey } from '@/types/integration-capabilities.type';
import type {
  CalendarSyncStatus,
  InterviewMeetingProvider,
} from '@/types/interview.type';
import type { PillTone } from '@/components/patterns';

export type AutoMeetingProvider = Extract<
  InterviewMeetingProvider,
  'google_meet' | 'zoom' | 'teams'
>;

export const MEETING_PROVIDER_LABEL: Record<InterviewMeetingProvider, string> =
  {
    none: 'No meeting link',
    manual: 'Manual link',
    google_meet: 'Google Meet',
    zoom: 'Zoom',
    teams: 'Microsoft Teams',
  };

const PROVIDER_CAPABILITY: Record<
  AutoMeetingProvider,
  IntegrationCapabilityKey
> = {
  google_meet: 'googleMeet',
  zoom: 'zoom',
  teams: 'teams',
};

export const AUTO_MEETING_PROVIDERS = Object.keys(
  PROVIDER_CAPABILITY,
) as AutoMeetingProvider[];

export function isAutoMeetingProvider(
  provider: InterviewMeetingProvider | string | null | undefined,
): provider is AutoMeetingProvider {
  return AUTO_MEETING_PROVIDERS.includes(provider as AutoMeetingProvider);
}

export function useMeetingIntegrations() {
  const { data, isLoading } = useIntegrationCapabilities();
  const providers = AUTO_MEETING_PROVIDERS.filter((p) =>
    hasIntegrationCapability(data, PROVIDER_CAPABILITY[p]),
  );
  const calendars = [
    hasIntegrationCapability(data, 'googleCalendar') && 'Google Calendar',
    hasIntegrationCapability(data, 'microsoftCalendar') && 'Outlook',
  ].filter((c): c is string => !!c);
  return { providers, calendars, isLoading };
}

export const CALENDAR_SYNC_LABEL: Record<CalendarSyncStatus, string> = {
  pending: 'Syncing',
  synced: 'Synced',
  failed: 'Sync failed',
  skipped: 'Not synced',
};

export const CALENDAR_SYNC_TONE: Record<CalendarSyncStatus, PillTone> = {
  pending: 'info',
  synced: 'success',
  failed: 'danger',
  skipped: 'neutral',
};
