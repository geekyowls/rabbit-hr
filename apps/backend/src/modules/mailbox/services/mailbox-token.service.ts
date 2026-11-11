import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  decryptIntegrationData,
  encryptIntegrationData,
} from '@boilerplate/core';
import { MailboxConnectionEntity } from '@db/entities';
import { MailboxConnectionRepository } from '@db/repositories';
import { TOKEN_REFRESH_SKEW_MS } from '../mailbox.constants';
import {
  MailboxAuthError,
  MailboxTokens,
} from '../providers/mail-provider.types';
import { MailboxOAuthService } from './mailbox-oauth.service';

@Injectable()
export class MailboxTokenService {
  constructor(
    private readonly configService: ConfigService,
    private readonly oauthService: MailboxOAuthService,
    private readonly connectionRepository: MailboxConnectionRepository,
  ) {}

  encrypt(tokens: MailboxTokens): string {
    return encryptIntegrationData(
      {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      },
      this.encryptionKey(),
    );
  }

  expiresAt(tokens: MailboxTokens): Date | null {
    return tokens.expiresIn
      ? new Date(Date.now() + tokens.expiresIn * 1000)
      : null;
  }

  async loadWithSecrets(id: string): Promise<MailboxConnectionEntity | null> {
    return this.connectionRepository
      .createQueryBuilder('mailbox')
      .addSelect(['mailbox.encryptedTokens', 'mailbox.syncCursor'])
      .where('mailbox.id = :id', { id })
      .getOne();
  }

  async getAccessToken(connection: MailboxConnectionEntity): Promise<string> {
    if (!connection.encryptedTokens) {
      throw new MailboxAuthError('Mailbox has no stored credentials');
    }
    let tokens: MailboxTokens;
    try {
      tokens = decryptIntegrationData(
        connection.encryptedTokens,
        this.encryptionKey(),
      ) as MailboxTokens;
    } catch {
      throw new MailboxAuthError('Stored mailbox credentials are unreadable');
    }
    const expiresAt = connection.tokenExpiresAt?.getTime() ?? 0;
    if (expiresAt > Date.now() + TOKEN_REFRESH_SKEW_MS) {
      return tokens.accessToken;
    }
    if (!tokens.refreshToken) {
      throw new MailboxAuthError('Mailbox session expired, reconnect it');
    }
    const refreshed = await this.oauthService.refresh(
      connection.provider,
      tokens.refreshToken,
    );
    connection.encryptedTokens = this.encrypt(refreshed);
    connection.tokenExpiresAt = this.expiresAt(refreshed);
    await this.connectionRepository.update(connection.id, {
      encryptedTokens: connection.encryptedTokens,
      tokenExpiresAt: connection.tokenExpiresAt,
    });
    return refreshed.accessToken;
  }

  private encryptionKey(): string {
    const key = this.configService.get<string>('INTEGRATION_ENCRYPTION_KEY');
    if (!key) {
      throw new BadRequestException(
        'INTEGRATION_ENCRYPTION_KEY is not configured',
      );
    }
    return key;
  }
}
