import { BadRequestException, Injectable } from '@nestjs/common';
import { RedisCacheService } from '@boilerplate/core';
import { MailboxConnectionStatus } from '@db/enums';
import { MailboxConnectionRepository } from '@db/repositories';
import { CACHE_KEYS } from '@shared/cache-keys';
import { ContextLogger } from '@shared/framework/context-logger';
import { OAUTH_STATE_MAX_AGE_MS } from '../../mailbox.constants';
import { MailboxOAuthService } from '../../services/mailbox-oauth.service';
import { MailboxTokenService } from '../../services/mailbox-token.service';
import { MailboxSyncScheduler } from '../../services/mailbox-sync-scheduler.service';
import { decodeOAuthState, MailboxOAuthState } from '../oauth-state';
import { HandleMailboxCallbackCommand } from './handle-mailbox-callback.command';

@Injectable()
export class HandleMailboxCallback {
  private readonly logger = new ContextLogger(HandleMailboxCallback.name);

  constructor(
    private readonly connectionRepository: MailboxConnectionRepository,
    private readonly oauthService: MailboxOAuthService,
    private readonly tokenService: MailboxTokenService,
    private readonly scheduler: MailboxSyncScheduler,
    private readonly cacheService: RedisCacheService,
  ) {}

  async execute(
    command: HandleMailboxCallbackCommand,
  ): Promise<{ mailboxId: string }> {
    const state = await this.verifyState(command.state);
    const { tokens, account } = await this.oauthService.exchangeCode(
      state.provider,
      command.code,
    );

    const existing = await this.connectionRepository
      .createQueryBuilder('mailbox')
      .addSelect('mailbox.syncCursor')
      .where('mailbox.organizationId = :organizationId', {
        organizationId: state.organizationId,
      })
      .andWhere('mailbox.provider = :provider', { provider: state.provider })
      .andWhere('LOWER(mailbox.emailAddress) = :email', {
        email: account.emailAddress,
      })
      .getOne();
    if (
      existing &&
      !existing.isShared &&
      !existing.isDemo &&
      existing.userId !== state.userId
    ) {
      throw new BadRequestException(
        'This mailbox is already connected by another user',
      );
    }

    const mailbox = existing ?? this.connectionRepository.create();
    Object.assign(mailbox, {
      organizationId: state.organizationId,
      userId: state.shared ? null : state.userId,
      connectedById: state.userId,
      provider: state.provider,
      emailAddress: account.emailAddress,
      displayName: account.displayName,
      isShared: state.shared,
      encryptedTokens: this.tokenService.encrypt(tokens),
      tokenExpiresAt: this.tokenService.expiresAt(tokens),
      status: MailboxConnectionStatus.CONNECTED,
      errorMessage: null,
      syncEnabled: true,
      syncCursor: existing?.isDemo ? null : (existing?.syncCursor ?? null),
      isDemo: false,
    });
    const saved = await this.connectionRepository.save(mailbox);

    try {
      await this.scheduler.schedule(saved);
      await this.scheduler.triggerNow(saved.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Mailbox ${saved.id} sync not scheduled: ${message}`);
    }

    return { mailboxId: saved.id };
  }

  private async verifyState(value: string): Promise<MailboxOAuthState> {
    const state = decodeOAuthState(value);
    if (!state) {
      throw new BadRequestException('Invalid OAuth state');
    }
    if (Date.now() - state.timestamp > OAUTH_STATE_MAX_AGE_MS) {
      throw new BadRequestException('OAuth state expired');
    }
    const key = CACHE_KEYS.mailboxOauthNonce(state.organizationId, state.nonce);
    const stored: string | null = await this.cacheService.getString(key);
    if (!stored) {
      throw new BadRequestException(
        'Invalid OAuth state: nonce not found or expired',
      );
    }
    await this.cacheService.deleteKey(key);
    const nonceData = JSON.parse(stored) as Partial<MailboxOAuthState>;
    if (
      nonceData.userId !== state.userId ||
      nonceData.provider !== state.provider ||
      nonceData.shared !== state.shared
    ) {
      throw new BadRequestException('Invalid OAuth state: nonce mismatch');
    }
    return state;
  }
}
