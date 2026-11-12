import { Module } from '@nestjs/common';
import { MailboxCoreModule } from './mailbox-core.module';
import { MailboxController } from './mailbox.controller';
import { ConnectMailbox } from './usecases/connect-mailbox/connect-mailbox.usecase';
import { HandleMailboxCallback } from './usecases/handle-mailbox-callback/handle-mailbox-callback.usecase';
import { ListMailboxes } from './usecases/list-mailboxes/list-mailboxes.usecase';
import { DisconnectMailbox } from './usecases/disconnect-mailbox/disconnect-mailbox.usecase';
import { TriggerMailboxSync } from './usecases/trigger-mailbox-sync/trigger-mailbox-sync.usecase';

const USE_CASES = [
  ConnectMailbox,
  HandleMailboxCallback,
  ListMailboxes,
  DisconnectMailbox,
  TriggerMailboxSync,
];

@Module({
  imports: [MailboxCoreModule],
  controllers: [MailboxController],
  providers: USE_CASES,
  exports: [MailboxCoreModule],
})
export class MailboxModule {}
