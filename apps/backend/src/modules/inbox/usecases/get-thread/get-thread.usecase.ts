import { Injectable } from '@nestjs/common';
import {
  EmailMessageRepository,
  EmailThreadRepository,
} from '@db/repositories';
import { MailboxAccessService } from '@modules/mailbox/services/mailbox-access.service';
import {
  findAccessibleThread,
  loadThreadMessages,
  toMessageRow,
  toThreadRow,
} from '../thread-query';
import { InboxThreadCommand } from '../inbox-thread.command';

@Injectable()
export class GetThread {
  constructor(
    private readonly threadRepository: EmailThreadRepository,
    private readonly messageRepository: EmailMessageRepository,
    private readonly accessService: MailboxAccessService,
  ) {}

  async execute(command: InboxThreadCommand) {
    const mailboxIds = await this.accessService.resolveIds(
      command.organizationId,
      command.userId,
    );
    const thread = await findAccessibleThread(
      this.threadRepository,
      command.organizationId,
      mailboxIds,
      command.threadId,
    );
    const messages = await loadThreadMessages(
      this.messageRepository,
      thread.id,
    );
    return { ...toThreadRow(thread), messages: messages.map(toMessageRow) };
  }
}
