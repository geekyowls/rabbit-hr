import { IntegrationService, OAuthTokens } from './integration.service';

export interface CalendarEvent {
  summary: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendeeEmails: string[];
  meetingLink?: string;
  timeZone?: string;
  location?: string;
  withMeetingLink?: boolean;
}

export interface CalendarEventResult {
  eventId: string;
  meetingLink?: string;
}

export abstract class CalendarIntegrationService extends IntegrationService {
  abstract createCalendarEvent(
    tokens: OAuthTokens,
    event: CalendarEvent,
  ): Promise<CalendarEventResult>;

  abstract updateCalendarEvent(
    tokens: OAuthTokens,
    eventId: string,
    event: CalendarEvent,
  ): Promise<CalendarEventResult>;

  abstract deleteCalendarEvent(
    tokens: OAuthTokens,
    eventId: string,
  ): Promise<void>;
}
