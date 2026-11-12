import { Module } from '@nestjs/common';
import { MailboxOAuthService } from './services/mailbox-oauth.service';
import { MailboxTokenService } from './services/mailbox-token.service';
import { MailboxStoreService } from './services/mailbox-store.service';
import { EmailLinkerService } from './services/email-linker.service';
import { MailboxAccessService } from './services/mailbox-access.service';
import { MailboxCapabilityService } from './services/mailbox-capability.service';
import { MailboxSyncScheduler } from './services/mailbox-sync-scheduler.service';
import { MailboxSyncService } from './services/mailbox-sync.service';
import { GmailMailProvider } from './providers/gmail-mail.provider';
import { OutlookMailProvider } from './providers/outlook-mail.provider';

const PROVIDERS = [
  MailboxOAuthService,
  MailboxTokenService,
  MailboxStoreService,
  EmailLinkerService,
  MailboxAccessService,
  MailboxCapabilityService,
  MailboxSyncScheduler,
  MailboxSyncService,
  GmailMailProvider,
  OutlookMailProvider,
];

@Module({
  providers: PROVIDERS,
  exports: PROVIDERS,
})
export class MailboxCoreModule {}
