import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

import { IntegrationProvider } from '../..';
import { toZonedDateTimeStr } from '../../utils/zoned-time';

import { OAuthTokens } from './integration.service';
import {
  CalendarEvent,
  CalendarEventResult,
  CalendarIntegrationService,
} from './calendar-integration.service';

const GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0';
const MICROSOFT_OAUTH_BASE =
  'https://login.microsoftonline.com/common/oauth2/v2.0';

interface MicrosoftTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

interface GraphEventResponse {
  id?: string;
  webLink?: string;
  onlineMeeting?: { joinUrl?: string } | null;
}

@Injectable()
export class MicrosoftGraphService extends CalendarIntegrationService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly scopes = [
    'offline_access',
    'User.Read',
    'Calendars.ReadWrite',
    'OnlineMeetings.ReadWrite',
  ];
  private readonly isConfigured: boolean;

  constructor(private readonly configService: ConfigService) {
    super();

    this.clientId = this.configService.get<string>('MICROSOFT_CLIENT_ID') || '';
    this.clientSecret =
      this.configService.get<string>('MICROSOFT_CLIENT_SECRET') || '';
    this.redirectUri =
      this.configService.get<string>('MICROSOFT_REDIRECT_URI') ||
      this.configService.get<string>('OAUTH_REDIRECT_URI') ||
      '';

    this.isConfigured = !!(this.clientId && this.clientSecret);
  }

  isServiceConfigured(): boolean {
    return this.isConfigured;
  }

  private ensureConfigured(): void {
    if (!this.isConfigured) {
      throw new Error(
        'Microsoft 365 integration is not configured. Please set MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET environment variables.',
      );
    }
  }

  async getAuthorizationUrl(
    organizationId: string,
    userId: string,
  ): Promise<string> {
    this.ensureConfigured();
    const state = Buffer.from(
      JSON.stringify({
        organizationId,
        userId,
        provider: IntegrationProvider.MICROSOFT_TEAMS,
        timestamp: Date.now(),
        nonce: crypto.randomBytes(32).toString('hex'),
      }),
    ).toString('base64');
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: this.scopes.join(' '),
      state,
    });
    return `${MICROSOFT_OAUTH_BASE}/authorize?${params.toString()}`;
  }

  private async requestToken(
    params: Record<string, string>,
  ): Promise<MicrosoftTokenResponse> {
    this.ensureConfigured();
    const response = await fetch(`${MICROSOFT_OAUTH_BASE}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        scope: this.scopes.join(' '),
        ...params,
      }).toString(),
    });
    const data = (await response.json()) as MicrosoftTokenResponse;
    if (!response.ok || data.error || !data.access_token) {
      throw new Error(
        data.error_description ||
          data.error ||
          `Token request failed: ${response.status}`,
      );
    }
    return data;
  }

  async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
    try {
      const data = await this.requestToken({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
      });
      return {
        accessToken: data.access_token!,
        refreshToken: data.refresh_token || '',
        expiresAt: new Date(Date.now() + (data.expires_in ?? 3600) * 1000),
      };
    } catch (error: any) {
      throw new Error(`Failed to exchange code for tokens: ${error.message}`);
    }
  }

  async refreshTokens(refreshToken: string): Promise<OAuthTokens> {
    try {
      const data = await this.requestToken({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      });
      return {
        accessToken: data.access_token!,
        refreshToken: data.refresh_token || refreshToken,
        expiresAt: new Date(Date.now() + (data.expires_in ?? 3600) * 1000),
      };
    } catch (error: any) {
      throw new Error(`Failed to refresh tokens: ${error.message}`);
    }
  }

  private buildEventBody(event: CalendarEvent, includeOnlineMeeting: boolean) {
    const timeZone = event.timeZone || 'UTC';
    const description = [
      event.description,
      event.meetingLink ? `Join: ${event.meetingLink}` : null,
    ]
      .filter(Boolean)
      .join('\n\n');
    const location = event.location || event.meetingLink;
    return {
      subject: event.summary,
      body: { contentType: 'text', content: description },
      start: {
        dateTime: toZonedDateTimeStr(event.startTime, timeZone),
        timeZone,
      },
      end: { dateTime: toZonedDateTimeStr(event.endTime, timeZone), timeZone },
      attendees: event.attendeeEmails.map((address) => ({
        emailAddress: { address },
        type: 'required',
      })),
      ...(location ? { location: { displayName: location } } : {}),
      ...(includeOnlineMeeting
        ? { isOnlineMeeting: true, onlineMeetingProvider: 'teamsForBusiness' }
        : {}),
    };
  }

  private async graphRequest(
    tokens: OAuthTokens,
    path: string,
    method: 'POST' | 'PATCH' | 'DELETE' | 'GET',
    body?: unknown,
  ): Promise<Response> {
    this.ensureConfigured();
    return fetch(`${GRAPH_API_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        'Content-Type': 'application/json',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  }

  private async toResult(
    response: Response,
    action: string,
  ): Promise<CalendarEventResult> {
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Microsoft Graph ${action} failed: ${response.status} ${errorText}`,
      );
    }
    const data = (await response.json()) as GraphEventResponse;
    if (!data.id) {
      throw new Error('No event ID returned from Microsoft Graph');
    }
    const joinUrl = data.onlineMeeting?.joinUrl;
    return joinUrl
      ? { eventId: data.id, meetingLink: joinUrl }
      : { eventId: data.id };
  }

  async createCalendarEvent(
    tokens: OAuthTokens,
    event: CalendarEvent,
  ): Promise<CalendarEventResult> {
    try {
      const response = await this.graphRequest(
        tokens,
        '/me/events',
        'POST',
        this.buildEventBody(
          event,
          event.withMeetingLink !== false && !event.meetingLink,
        ),
      );
      return await this.toResult(response, 'event create');
    } catch (error: any) {
      throw new Error(`Failed to create Outlook event: ${error.message}`);
    }
  }

  async updateCalendarEvent(
    tokens: OAuthTokens,
    eventId: string,
    event: CalendarEvent,
  ): Promise<CalendarEventResult> {
    try {
      const response = await this.graphRequest(
        tokens,
        `/me/events/${encodeURIComponent(eventId)}`,
        'PATCH',
        this.buildEventBody(
          event,
          event.withMeetingLink !== false && !event.meetingLink,
        ),
      );
      if (response.status === 404) {
        return this.createCalendarEvent(tokens, event);
      }
      return await this.toResult(response, 'event update');
    } catch (error: any) {
      throw new Error(`Failed to update Outlook event: ${error.message}`);
    }
  }

  async deleteCalendarEvent(
    tokens: OAuthTokens,
    eventId: string,
  ): Promise<void> {
    try {
      const response = await this.graphRequest(
        tokens,
        `/me/events/${encodeURIComponent(eventId)}`,
        'DELETE',
      );
      if (response.ok || response.status === 404) return;
      const errorText = await response.text();
      throw new Error(
        `Microsoft Graph event delete failed: ${response.status} ${errorText}`,
      );
    } catch (error: any) {
      throw new Error(`Failed to delete Outlook event: ${error.message}`);
    }
  }
}
