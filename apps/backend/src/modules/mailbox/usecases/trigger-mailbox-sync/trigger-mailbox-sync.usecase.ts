import { BadRequestException, Injectable } from '@nestjs/common';
import { MailboxConnectionStatus } from '@db/enums';
import { MailboxSyncResponseDto } from '../../dtos/mailbox.dto';
import { MailboxAccessService } from '../../services/mailbox-access.service';
import { MailboxSyncScheduler } from '../../services/mailbox-sync-scheduler.service';
import { MailboxCommand } from '../mailbox.command';

@Injectable()
export class TriggerMailboxSync {
  constructor(
    private readonly accessService: MailboxAccessService,
    private readonly scheduler: MailboxSyncScheduler,
  ) {}

  async execute(command: MailboxCommand): Promise<MailboxSyncResponseDto> {
    const mailbox = await this.accessService.getAccessible(
      command.organizationId,
      command.userId,
      command.mailboxId,
    );
    if (mailbox.isDemo) {
      return { queued: false, reason: 'Demo mailbox is not synced' };
    }
    if (
      mailbox.status === MailboxConnectionStatus.EXPIRED ||
      mailbox.status === MailboxConnectionStatus.DISCONNECTED
    ) {
      throw new BadRequestException('Reconnect this mailbox to sync it');
    }
    if (!mailbox.syncEnabled) {
      return { queued: false, reason: 'Sync is turned off for this mailbox' };
    }
    await this.scheduler.schedule(mailbox);
    await this.scheduler.triggerNow(mailbox.id);
    return { queued: true, reason: null };
  }
}
