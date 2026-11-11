import { ForbiddenException, Injectable } from '@nestjs/common';
import { MailboxConnectionRepository } from '@db/repositories';
import { ContextLogger } from '@shared/framework/context-logger';
import { MailboxAccessService } from '../../services/mailbox-access.service';
import { MailboxSyncScheduler } from '../../services/mailbox-sync-scheduler.service';
import { MailboxCommand } from '../mailbox.command';

@Injectable()
export class DisconnectMailbox {
  private readonly logger = new ContextLogger(DisconnectMailbox.name);

  constructor(
    private readonly connectionRepository: MailboxConnectionRepository,
    private readonly accessService: MailboxAccessService,
    private readonly scheduler: MailboxSyncScheduler,
  ) {}

  async execute(command: MailboxCommand): Promise<{ success: boolean }> {
    const mailbox = await this.accessService.getAccessible(
      command.organizationId,
      command.userId,
      command.mailboxId,
    );
    if (
      !this.accessService.canManage(
        mailbox,
        command.userId,
        command.permissions,
      )
    ) {
      throw new ForbiddenException('You cannot disconnect this mailbox');
    }
    try {
      await this.scheduler.unschedule(mailbox.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Mailbox ${mailbox.id} schedule not removed: ${message}`,
      );
    }
    await this.connectionRepository.delete({
      id: mailbox.id,
      organizationId: command.organizationId,
    });
    return { success: true };
  }
}
