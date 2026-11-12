import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { MailboxConnectionEntity } from '@db/entities';
import { MailboxConnectionStatus } from '@db/enums';
import { QUEUE_NAMES } from '@modules/queue/queue.module';
import {
  MAILBOX_SYNC_EVERY_MS,
  MAILBOX_SYNC_JOB,
  MailboxSyncJobData,
} from '../mailbox.constants';

const INACTIVE_STATUSES = [
  MailboxConnectionStatus.DISCONNECTED,
  MailboxConnectionStatus.EXPIRED,
];

@Injectable()
export class MailboxSyncScheduler {
  constructor(
    @InjectQueue(QUEUE_NAMES.MAILBOX_SYNC)
    private readonly queue: Queue<MailboxSyncJobData>,
  ) {}

  isSyncable(mailbox: MailboxConnectionEntity): boolean {
    return (
      mailbox.syncEnabled &&
      !mailbox.isDemo &&
      !INACTIVE_STATUSES.includes(mailbox.status)
    );
  }

  async schedule(mailbox: MailboxConnectionEntity): Promise<void> {
    if (!this.isSyncable(mailbox)) {
      await this.unschedule(mailbox.id);
      return;
    }
    await this.queue.upsertJobScheduler(
      this.schedulerId(mailbox.id),
      { every: MAILBOX_SYNC_EVERY_MS },
      { name: MAILBOX_SYNC_JOB, data: { connectionId: mailbox.id } },
    );
  }

  async unschedule(mailboxId: string): Promise<void> {
    await this.queue.removeJobScheduler(this.schedulerId(mailboxId));
  }

  async triggerNow(mailboxId: string): Promise<void> {
    await this.queue.add(
      MAILBOX_SYNC_JOB,
      { connectionId: mailboxId },
      { deduplication: { id: `manual-${mailboxId}` }, attempts: 1 },
    );
  }

  private schedulerId(mailboxId: string): string {
    return `mailbox-sync-${mailboxId}`;
  }
}
