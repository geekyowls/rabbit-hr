import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { google, Auth, calendar_v3 } from 'googleapis';

import { IntegrationProvider } from '../..';
import { toZonedDateTimeStr } from '../../utils/zoned-time';

import { OAuthTokens } from './integration.service';
import {
  CalendarIntegrationService,
  CalendarEvent,
} from './calendar-integration.service';

@Injectable()
export class GoogleCalendarService extends CalendarIntegrationService {
  private oauth2Client: Auth.OAuth2Client | null = null;
  private readonly scopes = [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar',
  ];
  private readonly isConfigured: boolean;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  constructor(private readonly configService: ConfigService) {
    super();

    this.clientId = this.configService.get<string>('GOOGLE_CLIENT_ID') || '';
    this.clientSecret =
      this.configService.get<string>('GOOGLE_CLIENT_SECRET') || '';
    this.redirectUri =
      this.configService.get<string>('GOOGLE_REDIRECT_URI') ||
      this.configService.get<string>('OAUTH_REDIRECT_URI') ||
      '';

    this.isConfigured = !!(this.clientId && this.clientSecret);

    if (this.isConfigured) {
      this.oauth2Client = new google.auth.OAuth2(
        this.clientId,
        this.clientSecret,
        this.redirectUri,
      );
    }
  }

  isServiceConfigured(): boolean {
    return this.isConfigured;
  }

  private ensureConfigured(): void {
    if (!this.isConfigured) {
      throw new Error(
        'Google Calendar integration is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.',
      );
    }
  }

  async getAuthorizationUrl(
    organizationId: string,
    userId: string,
  ): Promise<string> {
    this.ensureConfigured();
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized');
    }

    try {
      const state = Buffer.from(
        JSON.stringify({
          organizationId,
          userId,
          provider: IntegrationProvider.GOOGLE_CALENDAR,
          timestamp: Date.now(),
        }),
      ).toString('base64');

      const authUrl = this.oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: this.scopes,
        state,
        prompt: 'consent',
      });

      return authUrl;
    } catch (error: any) {
      throw new Error(
        `Failed to generate Google authorization URL: ${error.message}`,
      );
    }
  }

  async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
    this.ensureConfigured();
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized');
    }

    try {
      const { tokens } = await this.oauth2Client.getToken(code);

      if (
        !tokens.access_token ||
        !tokens.refresh_token ||
        !tokens.expiry_date
      ) {
        throw new Error('Incomplete token response from Google');
      }

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(tokens.expiry_date),
      };
    } catch (error: any) {
      throw new Error(`Failed to exchange code for tokens: ${error.message}`);
    }
  }

  async refreshTokens(refreshToken: string): Promise<OAuthTokens> {
    this.ensureConfigured();

    try {
      const client = new google.auth.OAuth2(
        this.clientId,
        this.clientSecret,
        this.redirectUri,
      );
      client.setCredentials({ refresh_token: refreshToken });

      const { credentials } = await client.refreshAccessToken();

      if (!credentials.access_token || !credentials.expiry_date) {
        throw new Error('Incomplete token refresh response from Google');
      }

      return {
        accessToken: credentials.access_token,
        refreshToken: credentials.refresh_token || refreshToken,
        expiresAt: new Date(credentials.expiry_date),
      };
    } catch (error: any) {
      throw new Error(`Failed to refresh tokens: ${error.message}`);
    }
  }

  private clientFor(tokens: OAuthTokens): Auth.OAuth2Client {
    this.ensureConfigured();
    const client = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      this.redirectUri,
    );
    client.setCredentials({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    });
    return client;
  }

  private buildEventBody(event: CalendarEvent, includeConference: boolean) {
    const timeZone = event.timeZone || 'UTC';
    const body: calendar_v3.Schema$Event = {
      summary: event.summary,
      start: {
        dateTime: toZonedDateTimeStr(event.startTime, timeZone),
        timeZone,
      },
      end: {
        dateTime: toZonedDateTimeStr(event.endTime, timeZone),
        timeZone,
      },
      attendees: event.attendeeEmails.map((email) => ({ email })),
      reminders: { useDefault: true },
    };
    const description = [
      event.description,
      event.meetingLink ? `Join: ${event.meetingLink}` : null,
    ]
      .filter(Boolean)
      .join('\n\n');
    if (description) {
      body.description = description;
    }
    if (event.location || event.meetingLink) {
      body.location = event.location || event.meetingLink;
    }
    if (includeConference) {
      body.conferenceData = {
        createRequest: {
          requestId: `meet-${crypto.randomUUID()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      };
    }
    return body;
  }

  private toResult(eventData: calendar_v3.Schema$Event): {
    eventId: string;
    meetingLink?: string;
  } {
    if (!eventData?.id) {
      throw new Error('No event ID returned from Google Calendar');
    }
    const meetingUri =
      eventData.hangoutLink ||
      eventData.conferenceData?.entryPoints?.find(
        (entry) => entry.entryPointType === 'video',
      )?.uri ||
      undefined;
    return meetingUri
      ? { eventId: eventData.id, meetingLink: meetingUri }
      : { eventId: eventData.id };
  }

  async createCalendarEvent(
    tokens: OAuthTokens,
    event: CalendarEvent,
  ): Promise<{ eventId: string; meetingLink?: string }> {
    try {
      const calendar = google.calendar({
        version: 'v3',
        auth: this.clientFor(tokens),
      });
      const response = await calendar.events.insert({
        calendarId: 'primary',
        conferenceDataVersion: 1,
        sendUpdates: 'all',
        requestBody: this.buildEventBody(
          event,
          event.withMeetingLink !== false && !event.meetingLink,
        ),
      });
      return this.toResult(response.data);
    } catch (error: any) {
      throw new Error(`Failed to create calendar event: ${error.message}`);
    }
  }

  async updateCalendarEvent(
    tokens: OAuthTokens,
    eventId: string,
    event: CalendarEvent,
  ): Promise<{ eventId: string; meetingLink?: string }> {
    try {
      const calendar = google.calendar({
        version: 'v3',
        auth: this.clientFor(tokens),
      });
      const existing = await calendar.events.get({
        calendarId: 'primary',
        eventId,
      });
      const hasConference = !!existing.data.conferenceData;
      const wantsConference =
        event.withMeetingLink !== false && !event.meetingLink;
      const response = await calendar.events.patch({
        calendarId: 'primary',
        eventId,
        conferenceDataVersion: 1,
        sendUpdates: 'all',
        requestBody: this.buildEventBody(
          event,
          wantsConference && !hasConference,
        ),
      });
      return this.toResult(response.data);
    } catch (error: any) {
      throw new Error(`Failed to update calendar event: ${error.message}`);
    }
  }

  async deleteCalendarEvent(
    tokens: OAuthTokens,
    eventId: string,
  ): Promise<void> {
    try {
      const calendar = google.calendar({
        version: 'v3',
        auth: this.clientFor(tokens),
      });
      await calendar.events.delete({
        calendarId: 'primary',
        eventId,
        sendUpdates: 'all',
      });
    } catch (error: any) {
      const status = error?.code ?? error?.response?.status;
      if (status === 404 || status === 410) return;
      throw new Error(`Failed to delete calendar event: ${error.message}`);
    }
  }
}
