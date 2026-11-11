import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';
import type {
  IntegrationCapabilities,
  IntegrationCapabilityKey,
} from '@/types/integration-capabilities.type';

export const integrationCapabilitiesKeys = {
  all: ['integration-capabilities'] as const,
};

export function useIntegrationCapabilities(enabled: boolean = true) {
  return useQuery({
    queryKey: integrationCapabilitiesKeys.all,
    queryFn: () =>
      fetchApi<IntegrationCapabilities>(API_ROUTES.INTEGRATIONS.CAPABILITIES),
    staleTime: 60_000,
    enabled,
  });
}

export function hasIntegrationCapability(
  capabilities: IntegrationCapabilities | undefined,
  key: IntegrationCapabilityKey,
): boolean {
  if (!capabilities) return false;
  switch (key) {
    case 'calendar':
      return capabilities.calendar.google || capabilities.calendar.microsoft;
    case 'googleCalendar':
      return capabilities.calendar.google;
    case 'microsoftCalendar':
      return capabilities.calendar.microsoft;
    case 'meetings':
      return (
        capabilities.meetings.googleMeet ||
        capabilities.meetings.zoom ||
        capabilities.meetings.teams
      );
    case 'googleMeet':
      return capabilities.meetings.googleMeet;
    case 'zoom':
      return capabilities.meetings.zoom;
    case 'teams':
      return capabilities.meetings.teams;
    case 'calls':
      return capabilities.calls;
    case 'whatsapp':
      return capabilities.whatsapp;
    case 'jobFeed':
      return capabilities.jobFeed;
    case 'mailbox':
      return capabilities.mailbox.connected;
  }
}
