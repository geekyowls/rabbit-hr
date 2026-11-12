import { Injectable } from '@nestjs/common';
import { calculateSkip, createPaginationMetadata } from '@boilerplate/core';
import {
  EmailFolder,
  InboxLinkedFilter,
  InboxSearchIn,
  MailboxConnectionStatus,
} from '@db/enums';
import { EmailThreadRepository } from '@db/repositories';
import { MailboxAccessService } from '@modules/mailbox/services/mailbox-access.service';
import { buildThreadQuery, toThreadRow } from '../thread-query';
import { ListThreadsCommand } from './list-threads.command';

const SEARCH_CLAUSES: Record<InboxSearchIn, string> = {
  [InboxSearchIn.ALL]:
    '(thread.subject ILIKE :search OR thread.snippet ILIKE :search OR thread.participants::text ILIKE :search)',
  [InboxSearchIn.SUBJECT]:
    '(thread.subject ILIKE :search OR thread.snippet ILIKE :search)',
  [InboxSearchIn.FROM_TO]: 'thread.participants::text ILIKE :search',
};

const LINKED_CLAUSES: Record<InboxLinkedFilter, string> = {
  [InboxLinkedFilter.CANDIDATE]: 'thread.candidateId IS NOT NULL',
  [InboxLinkedFilter.CLIENT]:
    'thread.clientId IS NOT NULL AND thread.candidateId IS NULL',
  [InboxLinkedFilter.UNLINKED]:
    'thread.candidateId IS NULL AND thread.clientId IS NULL',
};

@Injectable()
export class ListThreads {
  constructor(
    private readonly threadRepository: EmailThreadRepository,
    private readonly accessService: MailboxAccessService,
  ) {}

  async execute(command: ListThreadsCommand) {
    const mailboxes = await this.accessService.listAccessible(
      command.organizationId,
      command.userId,
    );
    const connected = mailboxes.some(
      (mailbox) => mailbox.status === MailboxConnectionStatus.CONNECTED,
    );
    const mailboxIds = await this.accessService.resolveIds(
      command.organizationId,
      command.userId,
      command.mailboxId,
    );
    if (mailboxIds.length === 0) {
      return {
        data: [],
        ...createPaginationMetadata(command.page, command.limit, 0),
        connected,
      };
    }

    const qb = buildThreadQuery(
      this.threadRepository,
      command.organizationId,
      mailboxIds,
    );
    if (command.folder) {
      qb.andWhere('thread.folder = :folder', { folder: command.folder });
    } else {
      qb.andWhere('thread.folder != :trash', { trash: EmailFolder.TRASH });
    }
    if (command.unreadOnly) {
      qb.andWhere('thread.unreadCount > 0');
    }
    if (command.search) {
      qb.andWhere(SEARCH_CLAUSES[command.searchIn ?? InboxSearchIn.ALL], {
        search: `%${command.search}%`,
      });
    }
    if (command.linked) {
      qb.andWhere(LINKED_CLAUSES[command.linked]);
    }
    if (command.candidateId) {
      qb.andWhere('thread.candidateId = :candidateId', {
        candidateId: command.candidateId,
      });
    }
    if (command.clientId) {
      qb.andWhere('thread.clientId = :clientId', {
        clientId: command.clientId,
      });
    }

    qb.orderBy('thread.lastMessageAt', 'DESC')
      .addOrderBy('thread.id', 'DESC')
      .skip(calculateSkip(command.page, command.limit))
      .take(command.limit);

    const [threads, total] = await qb.getManyAndCount();
    return {
      data: threads.map(toThreadRow),
      ...createPaginationMetadata(command.page, command.limit, total),
      connected,
    };
  }
}
