import { ForbiddenException, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { PERMISSIONS_ENUM, RedisCacheService } from '@boilerplate/core';
import { CACHE_KEYS, CACHE_TTL } from '@shared/cache-keys';
import { MailboxOAuthService } from '../../services/mailbox-oauth.service';
import { encodeOAuthState } from '../oauth-state';
import { ConnectMailboxCommand } from './connect-mailbox.command';

@Injectable()
export class ConnectMailbox {
  constructor(
    private readonly oauthService: MailboxOAuthService,
    private readonly cacheService: RedisCacheService,
  ) {}

  async execute(command: ConnectMailboxCommand): Promise<{ authUrl: string }> {
    if (
      command.shared &&
      !command.permissions.includes(PERMISSIONS_ENUM.MAILBOX_SHARED_MANAGE)
    ) {
      throw new ForbiddenException(
        'You do not have permission to connect a shared mailbox',
      );
    }

    const nonce = crypto.randomBytes(32).toString('hex');
    const state = encodeOAuthState({
      organizationId: command.organizationId,
      userId: command.userId,
      provider: command.provider,
      shared: command.shared,
      timestamp: Date.now(),
      nonce,
    });
    const authUrl = this.oauthService.buildAuthUrl(command.provider, state);

    await this.cacheService.setString(
      CACHE_KEYS.mailboxOauthNonce(command.organizationId, nonce),
      JSON.stringify({
        userId: command.userId,
        provider: command.provider,
        shared: command.shared,
      }),
      CACHE_TTL.OAUTH_NONCE,
    );

    return { authUrl };
  }
}
