import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { IntegrationProvider } from '../..';

import { OAuthTokens } from './integration.service';
import {
  MessagingIntegrationService,
  MessagePayload,
  Channel,
} from './messaging-integration.service';

const SLACK_API_BASE = 'https://slack.com/api';
const SLACK_OAUTH_BASE = 'https://slack.com/oauth/v2';

interface SlackTokenResponse {
  ok: boolean;
  access_token?: string;
  token_type?: string;
  scope?: string;
  bot_user_id?: string;
  app_id?: string;
  team?: {
    id: string;
    name: string;
  };
  authed_user?: {
    id: string;
  };
  error?: string;
}

interface SlackApiResponse {
  ok: boolean;
  error?: string;
  ts?: string;
  channel?: string;
  message?: {
    ts: string;
    text: string;
  };
}

interface SlackConversationsResponse {
  ok: boolean;
  channels?: Array<{
    id: string;
    name: string;
    is_private: boolean;
    is_archived: boolean;
  }>;
  error?: string;
}

@Injectable()
export class SlackService extends MessagingIntegrationService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly scopes = ['chat:write', 'channels:read', 'users:read'];
  private readonly isConfigured: boolean;

  constructor(private readonly configService: ConfigService) {
    super();

    this.clientId = this.configService.get<string>('SLACK_CLIENT_ID') || '';
    this.clientSecret = this.configService.get<string>('SLACK_CLIENT_SECRET') || '';
    this.redirectUri = this.configService.get<string>('SLACK_REDIRECT_URI') || '';

    this.isConfigured = !!(this.clientId && this.clientSecret && this.redirectUri);
  }

  isServiceConfigured(): boolean {
    return this.isConfigured;
  }

  private ensureConfigured(): void {
    if (!this.isConfigured) {
      throw new Error(
        'Slack integration is not configured. Please set SLACK_CLIENT_ID, SLACK_CLIENT_SECRET, and SLACK_REDIRECT_URI environment variables.'
      );
    }
  }

  async getAuthorizationUrl(organizationId: string, userId: string): Promise<string> {
    this.ensureConfigured();

    try {
      const state = Buffer.from(
        JSON.stringify({
          organizationId,
          userId,
          provider: IntegrationProvider.SLACK,
          timestamp: Date.now(),
        })
      ).toString('base64');

      const params = new URLSearchParams({
        client_id: this.clientId,
        redirect_uri: this.redirectUri,
        scope: this.scopes.join(','),
        state,
      });

      const authUrl = `${SLACK_OAUTH_BASE}/authorize?${params.toString()}`;
      return authUrl;
    } catch (error: any) {
      throw new Error(`Failed to generate Slack authorization URL: ${error.message}`);
    }
  }

  async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
    this.ensureConfigured();

    try {
      const params = new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: this.redirectUri,
      });

      const response = await fetch(`${SLACK_API_BASE}/oauth.v2.access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Slack token exchange failed: ${response.status} ${errorText}`);
      }

      const data = await response.json() as SlackTokenResponse;

      if (!data.ok || !data.access_token) {
        throw new Error(
          data.error || 'Failed to exchange code for tokens: Invalid response from Slack'
        );
      }

      const expiresAt = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000);

      return {
        accessToken: data.access_token,
        refreshToken: data.access_token,
        expiresAt,
      };
    } catch (error: any) {
      throw new Error(`Failed to exchange code for tokens: ${error.message}`);
    }
  }

  async refreshTokens(refreshToken: string): Promise<OAuthTokens> {
    this.ensureConfigured();

    try {
      const expiresAt = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000);

      return {
        accessToken: refreshToken,
        refreshToken: refreshToken,
        expiresAt,
      };
    } catch (error: any) {
      throw new Error(`Failed to refresh tokens: ${error.message}`);
    }
  }

  async sendMessage(
    tokens: OAuthTokens,
    message: MessagePayload
  ): Promise<{ messageId: string; timestamp: Date; channelId?: string }> {
    this.ensureConfigured();

    try {
      const requestBody: any = {
        channel: message.channel,
        text: message.text,
      };

      if (message.threadId) {
        requestBody.thread_ts = message.threadId;
      }

      if (message.attachments && message.attachments.length > 0) {
        requestBody.attachments = message.attachments;
      }

      const response = await fetch(`${SLACK_API_BASE}/chat.postMessage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Slack message sending failed: ${response.status} ${errorText}`);
      }

      const data = await response.json() as SlackApiResponse;

      if (!data.ok) {
        throw new Error(data.error || 'Failed to send message: Invalid response from Slack');
      }

      if (!data.ts) {
        throw new Error('No message timestamp returned from Slack');
      }

      const result: { messageId: string; timestamp: Date; channelId?: string } = {
        messageId: data.ts,
        timestamp: new Date(),
      };

      if (data.channel) {
        result.channelId = data.channel;
      }

      return result;
    } catch (error: any) {
      throw new Error(`Failed to send Slack message: ${error.message}`);
    }
  }

  async listChannels(tokens: OAuthTokens): Promise<Channel[]> {
    this.ensureConfigured();

    try {
      const params = new URLSearchParams({
        types: 'public_channel,private_channel',
        exclude_archived: 'true',
      });

      const response = await fetch(`${SLACK_API_BASE}/conversations.list?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Slack channel listing failed: ${response.status} ${errorText}`);
      }

      const data = await response.json() as SlackConversationsResponse;

      if (!data.ok) {
        throw new Error(data.error || 'Failed to list channels: Invalid response from Slack');
      }

      if (!data.channels) {
        return [];
      }

      return data.channels
        .filter((channel) => !channel.is_archived)
        .map((channel) => ({
          id: channel.id,
          name: channel.name,
          type: channel.is_private ? 'private' : 'public',
        }));
    } catch (error: any) {
      throw new Error(`Failed to list Slack channels: ${error.message}`);
    }
  }
}

