import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailboxProvider } from '@db/enums';
import {
  GMAIL_SCOPES,
  MAILBOX_CALLBACK_PATH,
  OUTLOOK_SCOPES,
} from '../mailbox.constants';
import {
  MailboxAccount,
  MailboxAuthError,
  MailboxTokens,
} from '../providers/mail-provider.types';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';
const MICROSOFT_BASE_URL =
  'https://login.microsoftonline.com/common/oauth2/v2.0';
const GRAPH_ME_URL = 'https://graph.microsoft.com/v1.0/me';

interface ProviderCredentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

interface TokenPayload {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

@Injectable()
export class MailboxOAuthService {
  constructor(private readonly configService: ConfigService) {}

  buildAuthUrl(provider: MailboxProvider, state: string): string {
    const { clientId, redirectUri } = this.credentials(provider);
    if (provider === MailboxProvider.GMAIL) {
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: GMAIL_SCOPES.join(' '),
        access_type: 'offline',
        prompt: 'consent',
        include_granted_scopes: 'true',
        state,
      });
      return `${GOOGLE_AUTH_URL}?${params.toString()}`;
    }
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      response_mode: 'query',
      scope: OUTLOOK_SCOPES.join(' '),
      prompt: 'select_account',
      state,
    });
    return `${MICROSOFT_BASE_URL}/authorize?${params.toString()}`;
  }

  async exchangeCode(
    provider: MailboxProvider,
    code: string,
  ): Promise<{ tokens: MailboxTokens; account: MailboxAccount }> {
    const { clientId, clientSecret, redirectUri } = this.credentials(provider);
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      ...(provider === MailboxProvider.OUTLOOK && {
        scope: OUTLOOK_SCOPES.join(' '),
      }),
    });
    const data = await this.postToken(provider, body);
    if (!data.access_token) {
      throw new BadRequestException(
        data.error_description || data.error || 'Failed to connect mailbox',
      );
    }
    const tokens: MailboxTokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
    const account = await this.fetchAccount(provider, tokens.accessToken);
    if (!account.emailAddress) {
      throw new BadRequestException('Could not read the mailbox address');
    }
    return { tokens, account };
  }

  async refresh(
    provider: MailboxProvider,
    refreshToken: string,
  ): Promise<MailboxTokens> {
    const { clientId, clientSecret } = this.credentials(provider);
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      ...(provider === MailboxProvider.OUTLOOK && {
        scope: OUTLOOK_SCOPES.join(' '),
      }),
    });
    const data = await this.postToken(provider, body);
    if (!data.access_token) {
      const message =
        data.error_description || data.error || 'Token refresh failed';
      if (data.error === 'invalid_grant') {
        throw new MailboxAuthError(message);
      }
      throw new Error(message);
    }
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresIn: data.expires_in,
    };
  }

  redirectUri(provider: MailboxProvider): string {
    const override = this.configService.get<string>(
      provider === MailboxProvider.GMAIL
        ? 'MAILBOX_GOOGLE_REDIRECT_URI'
        : 'MAILBOX_MICROSOFT_REDIRECT_URI',
    );
    const apiUrl = (
      this.configService.get<string>('API_URL') || 'http://localhost:4000'
    ).replace(/\/$/, '');
    return override || `${apiUrl}${MAILBOX_CALLBACK_PATH}`;
  }

  private credentials(provider: MailboxProvider): ProviderCredentials {
    const prefix = provider === MailboxProvider.GMAIL ? 'GOOGLE' : 'MICROSOFT';
    const clientId = this.configService.get<string>(`${prefix}_CLIENT_ID`);
    const clientSecret = this.configService.get<string>(
      `${prefix}_CLIENT_SECRET`,
    );
    if (!clientId || !clientSecret) {
      const label = provider === MailboxProvider.GMAIL ? 'Gmail' : 'Outlook';
      throw new BadRequestException(`${label} mailbox is not configured`);
    }
    return { clientId, clientSecret, redirectUri: this.redirectUri(provider) };
  }

  private async postToken(
    provider: MailboxProvider,
    body: URLSearchParams,
  ): Promise<TokenPayload> {
    const url =
      provider === MailboxProvider.GMAIL
        ? GOOGLE_TOKEN_URL
        : `${MICROSOFT_BASE_URL}/token`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    return (await response.json().catch(() => ({}))) as TokenPayload;
  }

  private async fetchAccount(
    provider: MailboxProvider,
    accessToken: string,
  ): Promise<MailboxAccount> {
    const url =
      provider === MailboxProvider.GMAIL ? GOOGLE_USERINFO_URL : GRAPH_ME_URL;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      return { emailAddress: '', displayName: null };
    }
    const data = (await response.json()) as Record<string, string | undefined>;
    if (provider === MailboxProvider.GMAIL) {
      return {
        emailAddress: (data.email ?? '').toLowerCase(),
        displayName: data.name ?? null,
      };
    }
    return {
      emailAddress: (data.mail || data.userPrincipalName || '').toLowerCase(),
      displayName: data.displayName ?? null,
    };
  }
}
