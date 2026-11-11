import { Module } from '@nestjs/common';
import { MailboxCoreModule } from './mailbox-core.module';
import { MailboxSyncProcessor } from './mailbox-sync.processor';
import { MailboxSyncBootstrap } from './mailbox-sync.bootstrap';

@Module({
  imports: [MailboxCoreModule],
  providers: [MailboxSyncProcessor, MailboxSyncBootstrap],
})
export class MailboxWorkerModule {}
