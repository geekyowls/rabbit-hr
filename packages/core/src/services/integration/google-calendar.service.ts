import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, Auth } from 'googleapis';

import { IntegrationProvider } from '../..';

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

  constructor(private readonly configService: ConfigService) {
    super();

    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI');

    this.isConfigured = !!(clientId && clientSecret && redirectUri);

    if (this.isConfigured) {
      this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    }
  }

  isServiceConfigured(): boolean {
    return this.isConfigured;
  }

  private ensureConfigured(): void {
    if (!this.isConfigured) {
      throw new Error(
        'Google Calendar integration is not configured. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI environment variables.'
      );
    }
  }

  async getAuthorizationUrl(organizationId: string, userId: string): Promise<string> {
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
        })
      ).toString('base64');

      const authUrl = this.oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: this.scopes,
        state,
        prompt: 'consent',
      });

      return authUrl;
    } catch (error: any) {
      throw new Error(`Failed to generate Google authorization URL: ${error.message}`);
    }
  }

  async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
    this.ensureConfigured();
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized');
    }

    try {
      const { tokens } = await this.oauth2Client.getToken(code);

      if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
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
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized');
    }

    try {
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken,
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();

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

  async createCalendarEvent(
    tokens: OAuthTokens,
    event: CalendarEvent
  ): Promise<{ eventId: string; meetingLink?: string }> {
    this.ensureConfigured();
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized');
    }

    try {
      this.oauth2Client.setCredentials({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      });

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      const eventBody: any = {
        summary: event.summary,
        start: {
          dateTime: event.startTime.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: event.endTime.toISOString(),
          timeZone: 'UTC',
        },
        attendees: event.attendeeEmails.map((email) => ({ email })),
        conferenceData: {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet',
            },
          },
        },
        reminders: {
          useDefault: true,
        },
      };

      if (event.description) {
        eventBody.description = event.description;
      }

      const response = await calendar.events.insert({
        calendarId: 'primary',
        conferenceDataVersion: 1,
        requestBody: eventBody,
      });

      const eventData = response.data;
      if (!eventData?.id) {
        throw new Error('No event ID returned from Google Calendar');
      }

      const meetingUri = eventData.conferenceData?.entryPoints?.[0]?.uri;
      const result: { eventId: string; meetingLink?: string } = {
        eventId: eventData.id,
      };

      if (meetingUri) {
        result.meetingLink = meetingUri;
      }

      return result;
    } catch (error: any) {
      throw new Error(`Failed to create calendar event: ${error.message}`);
    }
  }
}
