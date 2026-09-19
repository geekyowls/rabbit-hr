import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SupportedIntegrationRepository,
  OrganizationIntegrationRepository,
} from '@db/repositories';
import { OrganizationIntegrationStatus } from '@db/enums';
import { HandleOAuthCallbackCommand } from './handle-oauth-callback.command';
import { encryptIntegrationData, RedisCacheService } from '@boilerplate/core';
import { CACHE_KEYS } from '@shared/cache-keys';

interface OAuthState {
  organizationId: string;
  userId: string;
  integrationId: string;
  provider: string;
  timestamp: number;
  nonce?: string;
}

interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  accountEmail?: string;
  accountName?: string;
  apiDomain?: string;
  organizationId?: string;
}

@Injectable()
export class HandleOAuthCallback {
  constructor(
    private readonly supportedIntegrationRepository: SupportedIntegrationRepository,
    private readonly organizationIntegrationRepository: OrganizationIntegrationRepository,
    private readonly configService: ConfigService,
    private readonly cacheService: RedisCacheService,
  ) {}

  async execute(
    command: HandleOAuthCallbackCommand,
  ): Promise<{ success: boolean; provider: string }> {
    const state = this.decodeState(command.state);

    const maxAge = 10 * 60 * 1000;
    if (Date.now() - state.timestamp > maxAge) {
      throw new BadRequestException('OAuth state expired');
    }

    if (state.nonce) {
      const nonceKey = CACHE_KEYS.oauthNonce(state.nonce);
      const storedNonce = await this.cacheService.getString(nonceKey);

      if (!storedNonce) {
        throw new BadRequestException(
          'Invalid OAuth state: nonce not found or expired',
        );
      }

      const nonceData = JSON.parse(storedNonce);
      if (
        nonceData.organizationId !== state.organizationId ||
        nonceData.userId !== state.userId
      ) {
        throw new BadRequestException('Invalid OAuth state: nonce mismatch');
      }

      await this.cacheService.deleteKey(nonceKey);
    }

    const integration = await this.supportedIntegrationRepository.findOne({
      where: { id: state.integrationId },
    });

    if (!integration) {
      throw new BadRequestException('Integration not found');
    }

    const tokens = await this.exchangeCodeForTokens(
      state.provider,
      command.code,
      command.accountsServer,
    );

    const encryptedTokens = this.encryptTokens(tokens);

    let orgIntegration =
      await this.organizationIntegrationRepository.findByOrganizationAndIntegration(
        state.organizationId,
        state.integrationId,
      );

    const tokenExpiresAt = tokens.expiresIn
      ? new Date(Date.now() + tokens.expiresIn * 1000)
      : null;

    if (orgIntegration) {
      orgIntegration.encryptedTokens = encryptedTokens;
      orgIntegration.tokenExpiresAt = tokenExpiresAt;
      orgIntegration.status = OrganizationIntegrationStatus.CONNECTED;
      orgIntegration.connectedBy = state.userId;
      orgIntegration.accountEmail = tokens.accountEmail ?? null;
      orgIntegration.accountName = tokens.accountName ?? null;
      orgIntegration.errorMessage = null;
    } else {
      orgIntegration = this.organizationIntegrationRepository.create({
        organizationId: state.organizationId,
        supportedIntegrationId: state.integrationId,
        encryptedTokens,
        tokenExpiresAt,
        status: OrganizationIntegrationStatus.CONNECTED,
        connectedBy: state.userId,
        accountEmail: tokens.accountEmail ?? null,
        accountName: tokens.accountName ?? null,
      });
    }

    await this.organizationIntegrationRepository.save(orgIntegration);

    return { success: true, provider: state.provider };
  }

  private decodeState(stateString: string): OAuthState {
    try {
      const decoded = Buffer.from(stateString, 'base64').toString('utf8');
      return JSON.parse(decoded);
    } catch {
      throw new BadRequestException('Invalid OAuth state');
    }
  }

  private async exchangeCodeForTokens(
    provider: string,
    code: string,
    accountsServer?: string,
  ): Promise<TokenResponse> {
    const redirectUri =
      this.configService.get<string>('OAUTH_REDIRECT_URI') ||
      `${this.configService.get<string>('API_URL')}/api/v1/integrations/callback`;

    switch (provider) {
      case 'google_calendar':
        return this.exchangeGoogleCode(code, redirectUri);
      case 'zoom':
        return this.exchangeZoomCode(code, redirectUri);
      case 'slack':
        return this.exchangeSlackCode(code, redirectUri);
      case 'microsoft_teams':
        return this.exchangeMicrosoftCode(code, redirectUri);
      case 'zoho_books':
        return this.exchangeZohoCode(code, redirectUri, accountsServer);
      default:
        throw new BadRequestException(`Unsupported provider: ${provider}`);
    }
  }

  private async exchangeZohoCode(
    code: string,
    redirectUri: string,
    accountsServer?: string,
  ): Promise<TokenResponse> {
    const clientId = this.configService.get<string>('ZOHO_CLIENT_ID');
    const clientSecret = this.configService.get<string>('ZOHO_CLIENT_SECRET');
    const accountsUrl =
      accountsServer ||
      this.configService.get<string>('ZOHO_ACCOUNTS_URL') ||
      'https://accounts.zoho.com';

    const response = await fetch(`${accountsUrl}/oauth/v2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      throw new BadRequestException(
        data.error || 'Failed to exchange Zoho code',
      );
    }

    const apiDomain: string = data.api_domain || 'https://www.zohoapis.com';
    const organization = await this.fetchZohoOrganization(
      data.access_token,
      apiDomain,
    );

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      accountEmail: organization.email,
      accountName: organization.name,
      apiDomain,
      organizationId: organization.organizationId,
    };
  }

  private async fetchZohoOrganization(
    accessToken: string,
    apiDomain: string,
  ): Promise<{ organizationId?: string; name?: string; email?: string }> {
    try {
      const response = await fetch(`${apiDomain}/books/v3/organizations`, {
        headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        const org = data.organizations?.[0];
        if (org) {
          return {
            organizationId: org.organization_id,
            name: org.name,
            email: org.email,
          };
        }
      }
    } catch {
      // API call failed, return empty
    }
    return {};
  }

  private async exchangeGoogleCode(
    code: string,
    redirectUri: string,
  ): Promise<TokenResponse> {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new BadRequestException(
        data.error_description || 'Failed to exchange Google code',
      );
    }

    const userInfo = await this.fetchGoogleUserInfo(data.access_token);

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      accountEmail: userInfo.email,
      accountName: userInfo.name,
    };
  }

  private async fetchGoogleUserInfo(
    accessToken: string,
  ): Promise<{ email?: string; name?: string }> {
    try {
      const response = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      if (response.ok) {
        return response.json();
      }
    } catch {
      // API call failed, return empty
    }
    return {};
  }

  private async exchangeZoomCode(
    code: string,
    redirectUri: string,
  ): Promise<TokenResponse> {
    const clientId = this.configService.get<string>('ZOOM_CLIENT_ID');
    const clientSecret = this.configService.get<string>('ZOOM_CLIENT_SECRET');
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
      'base64',
    );

    const response = await fetch('https://zoom.us/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new BadRequestException(
        data.reason || 'Failed to exchange Zoom code',
      );
    }

    const userInfo = await this.fetchZoomUserInfo(data.access_token);

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      accountEmail: userInfo.email,
      accountName: userInfo.name,
    };
  }

  private async fetchZoomUserInfo(
    accessToken: string,
  ): Promise<{ email?: string; name?: string }> {
    try {
      const response = await fetch('https://api.zoom.us/v2/users/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        return {
          email: data.email,
          name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
        };
      }
    } catch {
      // API call failed, return empty
    }
    return {};
  }

  private async exchangeSlackCode(
    code: string,
    redirectUri: string,
  ): Promise<TokenResponse> {
    const clientId = this.configService.get<string>('SLACK_CLIENT_ID');
    const clientSecret = this.configService.get<string>('SLACK_CLIENT_SECRET');

    const response = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const data = await response.json();
    if (!data.ok) {
      throw new BadRequestException(
        data.error || 'Failed to exchange Slack code',
      );
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      accountEmail: data.authed_user?.email,
      accountName: data.team?.name,
    };
  }

  private async exchangeMicrosoftCode(
    code: string,
    redirectUri: string,
  ): Promise<TokenResponse> {
    const clientId = this.configService.get<string>('MICROSOFT_CLIENT_ID');
    const clientSecret = this.configService.get<string>(
      'MICROSOFT_CLIENT_SECRET',
    );

    const response = await fetch(
      'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId!,
          client_secret: clientSecret!,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      },
    );

    const data = await response.json();
    if (!response.ok) {
      throw new BadRequestException(
        data.error_description || 'Failed to exchange Microsoft code',
      );
    }

    const userInfo = await this.fetchMicrosoftUserInfo(data.access_token);

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      accountEmail: userInfo.email,
      accountName: userInfo.name,
    };
  }

  private async fetchMicrosoftUserInfo(
    accessToken: string,
  ): Promise<{ email?: string; name?: string }> {
    try {
      const response = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        return {
          email: data.mail || data.userPrincipalName,
          name: data.displayName,
        };
      }
    } catch {
      // API call failed, return empty
    }
    return {};
  }

  private encryptTokens(tokens: TokenResponse): string {
    const encryptionKey = this.configService.get<string>(
      'INTEGRATION_ENCRYPTION_KEY',
    );

    if (!encryptionKey) {
      throw new BadRequestException(
        'INTEGRATION_ENCRYPTION_KEY is not configured. Cannot store OAuth tokens securely.',
      );
    }

    return encryptIntegrationData(
      {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        apiDomain: tokens.apiDomain,
        organizationId: tokens.organizationId,
      },
      encryptionKey,
    );
  }
}
