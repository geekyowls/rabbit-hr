import { Injectable, Logger } from '@nestjs/common';
import { MailboxConnectionEntity } from '@db/entities';
import { MailboxConnectionStatus, MailboxProvider } from '@db/enums';
import { MailboxConnectionRepository } from '@db/repositories';
import { truncate } from '../helpers/email-address';
import { GmailMailProvider } from '../providers/gmail-mail.provider';
import { OutlookMailProvider } from '../providers/outlook-mail.provider';
import {
  MailboxAuthError,
  MailProviderAdapter,
} from '../providers/mail-provider.types';
import { MailboxStoreService } from './mailbox-store.service';
import { MailboxSyncScheduler } from './mailbox-sync-scheduler.service';
import { MailboxTokenService } from './mailbox-token.service';

export interface MailboxSyncOutcome {
  status: 'synced' | 'skipped' | 'failed';
  reason?: string;
  created?: number;
  updated?: number;
}

@Injectable()
export class MailboxSyncService {
  private readonly logger = new Logger(MailboxSyncService.name);

  constructor(
    private readonly connectionRepository: MailboxConnectionRepository,
    private readonly tokenService: MailboxTokenService,
    private readonly store: MailboxStoreService,
    private readonly scheduler: MailboxSyncScheduler,
    private readonly gmail: GmailMailProvider,
    private readonly outlook: OutlookMailProvider,
  ) {}

  adapter(provider: MailboxProvider): MailProviderAdapter {
    return provider === MailboxProvider.GMAIL ? this.gmail : this.outlook;
  }

  async sync(connectionId: string): Promise<MailboxSyncOutcome> {
    const mailbox = await this.tokenService.loadWithSecrets(connectionId);
    if (!mailbox) {
      await this.scheduler.unschedule(connectionId);
      return { status: 'skipped', reason: 'missing' };
    }
    if (mailbox.isDemo) {
      return { status: 'skipped', reason: 'demo' };
    }
    if (!this.scheduler.isSyncable(mailbox)) {
      await this.scheduler.unschedule(mailbox.id);
      return { status: 'skipped', reason: mailbox.status };
    }

    try {
      const accessToken = await this.tokenService.getAccessToken(mailbox);
      const result = await this.adapter(mailbox.provider).sync(
        accessToken,
        mailbox.emailAddress,
        mailbox.syncCursor,
      );
      const ingest = await this.store.ingest(mailbox, result.messages);
      await this.store.removeByProviderIds(
        mailbox.id,
        result.removedProviderMessageIds,
      );
      await this.connectionRepository.update(mailbox.id, {
        syncCursor: result.cursor,
        lastSyncedAt: new Date(),
        status: MailboxConnectionStatus.CONNECTED,
        errorMessage: null,
      });
      return { status: 'synced', ...ingest };
    } catch (error) {
      return this.recordFailure(mailbox, error);
    }
  }

  private async recordFailure(
    mailbox: MailboxConnectionEntity,
    error: unknown,
  ): Promise<MailboxSyncOutcome> {
    const message = error instanceof Error ? error.message : String(error);
    const expired = error instanceof MailboxAuthError;
    this.logger.warn(`Mailbox ${mailbox.id} sync failed: ${message}`);
    await this.connectionRepository.update(mailbox.id, {
      status: expired
        ? MailboxConnectionStatus.EXPIRED
        : MailboxConnectionStatus.ERROR,
      errorMessage: truncate(message, 500),
    });
    if (expired) {
      await this.scheduler.unschedule(mailbox.id);
    }
    return { status: 'failed', reason: message };
  }
}
