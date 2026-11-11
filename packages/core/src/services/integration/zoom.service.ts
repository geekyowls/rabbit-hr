import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

import { IntegrationProvider } from '../..';
import { toZonedDateTimeStr } from '../../utils/zoned-time';

import { OAuthTokens } from './integration.service';
import {
  CalendarIntegrationService,
  CalendarEvent,
} from './calendar-integration.service';

const ZOOM_API_BASE = 'https://api.zoom.us/v2';
const ZOOM_OAUTH_BASE = 'https://zoom.us/oauth';

interface ZoomTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface ZoomMeetingRequest {
  topic: string;
  type: number;
  start_time?: string;
  duration?: number;
  timezone?: string;
  agenda?: string;
  settings: {
    waiting_room: boolean;
    join_before_host: boolean;
    auto_recording: 'none' | 'local' | 'cloud';
    meeting_authentication?: boolean;
  };
  registrants?: Array<{ email: string }>;
}

interface ZoomMeetingResponse {
  id: string;
  join_url: string;
  start_url: string;
  topic: string;
  start_time: string;
  duration: number;
  timezone: string;
  created_at: string;
  settings: {
    waiting_room: boolean;
    join_before_host: boolean;
  };
}

@Injectable()
export class ZoomService extends CalendarIntegrationService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly scopes = ['meeting:write', 'meeting:read', 'user:read'];
  private readonly isConfigured: boolean;

  constructor(private readonly configService: ConfigService) {
    super();

    this.clientId = this.configService.get<string>('ZOOM_CLIENT_ID') || '';
    this.clientSecret =
      this.configService.get<string>('ZOOM_CLIENT_SECRET') || '';
    this.redirectUri =
      this.configService.get<string>('ZOOM_REDIRECT_URI') ||
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
        'Zoom integration is not configured. Please set ZOOM_CLIENT_ID and ZOOM_CLIENT_SECRET environment variables.',
      );
    }
  }

  async getAuthorizationUrl(
    organizationId: string,
    userId: string,
  ): Promise<string> {
    this.ensureConfigured();

    try {
      const state = Buffer.from(
        JSON.stringify({
          organizationId,
          userId,
          provider: IntegrationProvider.ZOOM,
          timestamp: Date.now(),
          nonce: crypto.randomBytes(32).toString('hex'),
        }),
      ).toString('base64');

      const params = new URLSearchParams({
        response_type: 'code',
        client_id: this.clientId,
        redirect_uri: this.redirectUri,
        scope: this.scopes.join(' '),
        state,
      });

      const authUrl = `${ZOOM_OAUTH_BASE}/authorize?${params.toString()}`;
      return authUrl;
    } catch (error: any) {
      throw new Error(
        `Failed to generate Zoom authorization URL: ${error.message}`,
      );
    }
  }

  async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
    this.ensureConfigured();

    try {
      const credentials = Buffer.from(
        `${this.clientId}:${this.clientSecret}`,
      ).toString('base64');

      const response = await fetch(`${ZOOM_OAUTH_BASE}/token`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.redirectUri,
        }).toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Zoom token exchange failed: ${response.status} ${errorText}`,
        );
      }

      const data = (await response.json()) as ZoomTokenResponse;

      if (!data.access_token || !data.refresh_token || !data.expires_in) {
        throw new Error('Incomplete token response from Zoom');
      }

      const expiresAt = new Date(Date.now() + data.expires_in * 1000);

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt,
      };
    } catch (error: any) {
      throw new Error(`Failed to exchange code for tokens: ${error.message}`);
    }
  }

  async refreshTokens(refreshToken: string): Promise<OAuthTokens> {
    this.ensureConfigured();

    try {
      const credentials = Buffer.from(
        `${this.clientId}:${this.clientSecret}`,
      ).toString('base64');

      const response = await fetch(`${ZOOM_OAUTH_BASE}/token`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }).toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Zoom token refresh failed: ${response.status} ${errorText}`,
        );
      }

      const data = (await response.json()) as ZoomTokenResponse;

      if (!data.access_token || !data.expires_in) {
        throw new Error('Incomplete token refresh response from Zoom');
      }

      const expiresAt = new Date(Date.now() + data.expires_in * 1000);

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
        expiresAt,
      };
    } catch (error: any) {
      throw new Error(`Failed to refresh tokens: ${error.message}`);
    }
  }

  private buildMeetingRequest(event: CalendarEvent): ZoomMeetingRequest {
    const durationMs = event.endTime.getTime() - event.startTime.getTime();
    const durationMinutes = Math.max(1, Math.round(durationMs / (1000 * 60)));
    const timeZone = event.timeZone || 'UTC';
    const request: ZoomMeetingRequest = {
      topic: event.summary.slice(0, 200),
      type: 2,
      start_time: toZonedDateTimeStr(event.startTime, timeZone),
      duration: durationMinutes,
      timezone: timeZone,
      settings: {
        waiting_room: true,
        join_before_host: false,
        auto_recording: 'none',
      },
    };
    if (event.description) {
      request.agenda = event.description.slice(0, 2000);
    }
    return request;
  }

  private async zoomRequest(
    tokens: OAuthTokens,
    path: string,
    method: 'POST' | 'PATCH' | 'DELETE' | 'GET',
    body?: unknown,
  ): Promise<Response> {
    this.ensureConfigured();
    return fetch(`${ZOOM_API_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        'Content-Type': 'application/json',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  }

  async createCalendarEvent(
    tokens: OAuthTokens,
    event: CalendarEvent,
  ): Promise<{ eventId: string; meetingLink?: string }> {
    try {
      const response = await this.zoomRequest(
        tokens,
        '/users/me/meetings',
        'POST',
        this.buildMeetingRequest(event),
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Zoom meeting creation failed: ${response.status} ${errorText}`,
        );
      }

      const meetingData = (await response.json()) as ZoomMeetingResponse;

      if (!meetingData.id || !meetingData.join_url) {
        throw new Error('No meeting ID or join URL returned from Zoom');
      }

      return {
        eventId: meetingData.id.toString(),
        meetingLink: meetingData.join_url,
      };
    } catch (error: any) {
      throw new Error(`Failed to create Zoom meeting: ${error.message}`);
    }
  }

  async updateCalendarEvent(
    tokens: OAuthTokens,
    eventId: string,
    event: CalendarEvent,
  ): Promise<{ eventId: string; meetingLink?: string }> {
    try {
      const response = await this.zoomRequest(
        tokens,
        `/meetings/${encodeURIComponent(eventId)}`,
        'PATCH',
        this.buildMeetingRequest(event),
      );
      if (response.status === 404) {
        return this.createCalendarEvent(tokens, event);
      }
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Zoom meeting update failed: ${response.status} ${errorText}`,
        );
      }
      const details = await this.zoomRequest(
        tokens,
        `/meetings/${encodeURIComponent(eventId)}`,
        'GET',
      );
      const meetingData = details.ok
        ? ((await details.json()) as ZoomMeetingResponse)
        : null;
      return meetingData?.join_url
        ? { eventId, meetingLink: meetingData.join_url }
        : { eventId };
    } catch (error: any) {
      throw new Error(`Failed to update Zoom meeting: ${error.message}`);
    }
  }

  async deleteCalendarEvent(
    tokens: OAuthTokens,
    eventId: string,
  ): Promise<void> {
    try {
      const response = await this.zoomRequest(
        tokens,
        `/meetings/${encodeURIComponent(eventId)}`,
        'DELETE',
      );
      if (response.ok || response.status === 404) return;
      const errorText = await response.text();
      throw new Error(
        `Zoom meeting delete failed: ${response.status} ${errorText}`,
      );
    } catch (error: any) {
      throw new Error(`Failed to delete Zoom meeting: ${error.message}`);
    }
  }
}
