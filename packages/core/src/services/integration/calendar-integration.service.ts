import { IntegrationService, OAuthTokens } from './integration.service';

/**
 * Calendar event data for creating events via integrations
 */
export interface CalendarEvent {
  summary: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendeeEmails: string[];
  meetingLink?: string;
}

/**
 * Abstract service for calendar integrations
 *
 * Extends the base IntegrationService to add calendar-specific functionality.
 * Calendar integrations (Google Calendar, Outlook Calendar, etc.) should extend
 * this class to provide calendar event creation capabilities.
 *
 * This service handles:
 * - OAuth2 authentication (inherited from IntegrationService)
 * - Calendar event creation with optional meeting links
 */
export abstract class CalendarIntegrationService extends IntegrationService {
  /**
   * Create a calendar event with optional meeting link
   *
   * @param tokens - OAuth tokens for API authentication
   * @param event - Calendar event data
   * @returns Promise resolving to event details including ID and meeting link
   */
  abstract createCalendarEvent(
    tokens: OAuthTokens,
    event: CalendarEvent
  ): Promise<{ eventId: string; meetingLink?: string }>;
}

