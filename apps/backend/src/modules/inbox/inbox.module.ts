import { Module } from '@nestjs/common';
import { MailboxModule } from '@modules/mailbox/mailbox.module';
import { EmailTemplateModule } from '@modules/email-template/email-template.module';
import { InboxController } from './inbox.controller';
import { ListThreads } from './usecases/list-threads/list-threads.usecase';
import { GetThread } from './usecases/get-thread/get-thread.usecase';
import { UpdateThread } from './usecases/update-thread/update-thread.usecase';
import { SendInboxMessage } from './usecases/send-message/send-message.usecase';
import { InboxMergeValues } from './usecases/send-message/merge-values.service';
import { GetInboxStats } from './usecases/get-inbox-stats/get-inbox-stats.usecase';

const USE_CASES = [
  ListThreads,
  GetThread,
  UpdateThread,
  SendInboxMessage,
  GetInboxStats,
];

@Module({
  imports: [MailboxModule, EmailTemplateModule],
  controllers: [InboxController],
  providers: [...USE_CASES, InboxMergeValues],
})
export class InboxModule {}
