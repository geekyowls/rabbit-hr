import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { MailboxConnectionRepository } from '@db/repositories';
import { MailboxSyncScheduler } from './services/mailbox-sync-scheduler.service';

@Injectable()
export class MailboxSyncBootstrap implements OnApplicationBootstrap {
  private readonly logger = new Logger(MailboxSyncBootstrap.name);

  constructor(
    private readonly connectionRepository: MailboxConnectionRepository,
    private readonly scheduler: MailboxSyncScheduler,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      const mailboxes = await this.connectionRepository.find();
      for (const mailbox of mailboxes) {
        await this.scheduler.schedule(mailbox);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Mailbox sync schedules not reconciled: ${message}`);
    }
  }
}
