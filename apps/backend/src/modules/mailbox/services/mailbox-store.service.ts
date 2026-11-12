import { Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import {
  EmailMessageEntity,
  EmailThreadEntity,
  MailboxConnectionEntity,
} from '@db/entities';
import {
  EmailMessageRepository,
  EmailThreadRepository,
} from '@db/repositories';
import { EmailDeliveryStatus, EmailDirection, EmailFolder } from '@db/enums';
import { truncate, uniqueParticipants } from '../helpers/email-address';
import { ProviderMessage } from '../providers/mail-provider.types';
import { EmailLinkerService, EmailLinkMatch } from './email-linker.service';

const FOLDER_PRIORITY = [
  EmailFolder.INBOX,
  EmailFolder.SENT,
  EmailFolder.ARCHIVE,
  EmailFolder.DRAFTS,
  EmailFolder.TRASH,
];

export interface IngestResult {
  created: number;
  updated: number;
  activities: number;
}

export interface OutboundMessageInput {
  mailbox: MailboxConnectionEntity;
  thread: EmailThreadEntity | null;
  message: ProviderMessage;
  sentByUserId: string;
  deliveryStatus: EmailDeliveryStatus;
  link: Partial<EmailLinkMatch> & { applicationId?: string | null };
}

function resolveThreadFolder(folders: EmailFolder[]): EmailFolder {
  return (
    FOLDER_PRIORITY.find((folder) => folders.includes(folder)) ??
    EmailFolder.INBOX
  );
}

@Injectable()
export class MailboxStoreService {
  constructor(
    private readonly threadRepository: EmailThreadRepository,
    private readonly messageRepository: EmailMessageRepository,
    private readonly linker: EmailLinkerService,
  ) {}

  async ingest(
    mailbox: MailboxConnectionEntity,
    messages: ProviderMessage[],
  ): Promise<IngestResult> {
    if (messages.length === 0) return { created: 0, updated: 0, activities: 0 };

    const sorted = [...messages].sort(
      (a, b) => a.sentAt.getTime() - b.sentAt.getTime(),
    );
    const index = await this.linker.buildIndex(
      mailbox.organizationId,
      sorted.flatMap((message) => [
        message.from.email,
        ...[...message.to, ...message.cc, ...message.bcc].map((p) => p.email),
      ]),
    );

    const threads = await this.threadRepository.find({
      where: {
        mailboxId: mailbox.id,
        providerThreadId: In([
          ...new Set(sorted.map((message) => message.providerThreadId)),
        ]),
      },
    });
    const threadsByProviderId = new Map(
      threads.map((thread) => [thread.providerThreadId, thread]),
    );

    const internetIds = sorted
      .map((message) => message.internetMessageId)
      .filter((id): id is string => !!id);
    const existingMessages = await this.messageRepository.find({
      where: [
        {
          mailboxId: mailbox.id,
          providerMessageId: In(sorted.map((m) => m.providerMessageId)),
        },
        ...(internetIds.length
          ? [{ mailboxId: mailbox.id, internetMessageId: In(internetIds) }]
          : []),
      ],
    });
    const byProviderId = new Map(
      existingMessages.map((message) => [message.providerMessageId, message]),
    );
    const byInternetId = new Map(
      existingMessages
        .filter((message) => message.internetMessageId)
        .map((message) => [message.internetMessageId!, message]),
    );

    const created: EmailMessageEntity[] = [];
    const touched = new Map<string, EmailThreadEntity>();
    const unarchive = new Set<string>();
    let updated = 0;

    for (const incoming of sorted) {
      let thread = threadsByProviderId.get(incoming.providerThreadId);
      if (!thread) {
        thread = await this.threadRepository.save(
          this.threadRepository.create({
            organizationId: mailbox.organizationId,
            mailboxId: mailbox.id,
            providerThreadId: incoming.providerThreadId,
            subject: truncate(incoming.subject, 500),
            snippet: truncate(incoming.snippet, 500),
            lastMessageAt: incoming.sentAt,
            folder: incoming.folder,
          }),
        );
        threadsByProviderId.set(incoming.providerThreadId, thread);
      }
      touched.set(thread.id, thread);

      const existing =
        byProviderId.get(incoming.providerMessageId) ??
        (incoming.internetMessageId
          ? byInternetId.get(incoming.internetMessageId)
          : undefined);
      const link = this.linker.match(
        index,
        this.toLinkable(incoming),
        mailbox.emailAddress,
      );

      if (existing) {
        Object.assign(existing, {
          threadId: thread.id,
          providerMessageId: incoming.providerMessageId,
          internetMessageId:
            incoming.internetMessageId ?? existing.internetMessageId,
          inReplyTo: existing.inReplyTo ?? incoming.inReplyTo,
          references: existing.references ?? incoming.references,
          labels: incoming.labels,
          folder: incoming.folder,
          isRead: incoming.isRead,
          hasAttachments: incoming.hasAttachments,
          attachments: incoming.attachments,
          bodyHtml: existing.bodyHtml ?? incoming.bodyHtml,
          bodyText: existing.bodyText ?? incoming.bodyText,
          candidateId: existing.candidateId ?? link.candidateId,
          clientId: existing.clientId ?? link.clientId,
          clientContactId: existing.clientContactId ?? link.clientContactId,
        });
        await this.messageRepository.save(existing);
        updated += 1;
        continue;
      }

      const message = await this.messageRepository.save(
        this.messageRepository.create({
          ...this.toColumns(mailbox, thread.id, incoming),
          candidateId: link.candidateId ?? thread.candidateId,
          clientId: link.clientId ?? thread.clientId,
          clientContactId: link.clientContactId,
        }),
      );
      byProviderId.set(message.providerMessageId, message);
      created.push(message);
      if (!incoming.isOutbound && incoming.folder === EmailFolder.INBOX) {
        unarchive.add(thread.id);
      }
    }

    await this.refreshThreads([...touched.keys()], unarchive);
    const refreshed = await this.threadRepository.find({
      where: { id: In([...touched.keys()]) },
    });
    const activities = await this.linker.recordActivities(
      created,
      new Map(refreshed.map((thread) => [thread.id, thread])),
    );
    return { created: created.length, updated, activities };
  }

  async removeByProviderIds(mailboxId: string, providerMessageIds: string[]) {
    if (providerMessageIds.length === 0) return;
    const messages = await this.messageRepository.find({
      where: { mailboxId, providerMessageId: In(providerMessageIds) },
      select: ['id', 'threadId'],
    });
    if (messages.length === 0) return;
    await this.messageRepository.delete({
      id: In(messages.map((message) => message.id)),
    });
    await this.refreshThreads([
      ...new Set(messages.map((message) => message.threadId)),
    ]);
  }

  async storeOutbound(input: OutboundMessageInput) {
    const { mailbox, message } = input;
    const thread =
      input.thread ??
      (await this.threadRepository.save(
        this.threadRepository.create({
          organizationId: mailbox.organizationId,
          mailboxId: mailbox.id,
          providerThreadId: message.providerThreadId,
          subject: truncate(message.subject, 500),
          snippet: truncate(message.snippet, 500),
          lastMessageAt: message.sentAt,
          folder: EmailFolder.SENT,
          candidateId: input.link.candidateId ?? null,
          clientId: input.link.clientId ?? null,
          applicationId: input.link.applicationId ?? null,
        }),
      ));
    if (input.thread) {
      thread.candidateId ??= input.link.candidateId ?? null;
      thread.clientId ??= input.link.clientId ?? null;
      thread.applicationId ??= input.link.applicationId ?? null;
      await this.threadRepository.save(thread);
    }
    const saved = await this.messageRepository.save(
      this.messageRepository.create({
        ...this.toColumns(mailbox, thread.id, message),
        candidateId: input.link.candidateId ?? thread.candidateId,
        clientId: input.link.clientId ?? thread.clientId,
        clientContactId: input.link.clientContactId ?? null,
        sentByUserId: input.sentByUserId,
        deliveryStatus: input.deliveryStatus,
      }),
    );
    await this.refreshThreads([thread.id]);
    const refreshed = await this.threadRepository.findOneByOrFail({
      id: thread.id,
    });
    await this.linker.recordActivities(
      [saved],
      new Map([[refreshed.id, refreshed]]),
    );
    return { thread: refreshed, message: saved };
  }

  async refreshThreads(threadIds: string[], unarchive = new Set<string>()) {
    for (const threadId of threadIds) {
      const thread = await this.threadRepository.findOneBy({ id: threadId });
      if (!thread) continue;
      const messages = await this.messageRepository.find({
        where: { threadId },
        select: [
          'id',
          'fromAddress',
          'fromName',
          'to',
          'cc',
          'subject',
          'snippet',
          'sentAt',
          'isRead',
          'isOutbound',
          'folder',
          'labels',
          'hasAttachments',
          'candidateId',
          'clientId',
        ],
        order: { sentAt: 'ASC' },
      });
      if (messages.length === 0) {
        await this.threadRepository.delete({ id: threadId });
        continue;
      }
      const last = messages[messages.length - 1];
      thread.subject = truncate(messages[0].subject || thread.subject, 500);
      thread.snippet = truncate(last.snippet, 500);
      thread.lastMessageAt = last.sentAt;
      thread.messageCount = messages.length;
      thread.unreadCount = messages.filter(
        (message) => !message.isOutbound && !message.isRead,
      ).length;
      thread.hasAttachments = messages.some(
        (message) => message.hasAttachments,
      );
      thread.labels = [
        ...new Set(messages.flatMap((message) => message.labels)),
      ];
      thread.participants = uniqueParticipants(
        messages.flatMap((message) => [
          { email: message.fromAddress, name: message.fromName },
          ...message.to,
          ...message.cc,
        ]),
      );
      thread.candidateId ??=
        messages.find((message) => message.candidateId)?.candidateId ?? null;
      thread.clientId ??=
        messages.find((message) => message.clientId)?.clientId ?? null;
      if (!thread.isArchived || unarchive.has(threadId)) {
        const folder = resolveThreadFolder(
          messages.map((message) => message.folder),
        );
        thread.folder = folder;
        thread.isArchived = folder === EmailFolder.ARCHIVE;
      }
      await this.threadRepository.save(thread);
    }
  }

  private toLinkable(message: ProviderMessage) {
    return {
      fromAddress: message.from.email,
      to: message.to,
      cc: message.cc,
      bcc: message.bcc,
      isOutbound: message.isOutbound,
    };
  }

  private toColumns(
    mailbox: MailboxConnectionEntity,
    threadId: string,
    message: ProviderMessage,
  ) {
    return {
      organizationId: mailbox.organizationId,
      mailboxId: mailbox.id,
      threadId,
      providerMessageId: message.providerMessageId,
      internetMessageId: message.internetMessageId,
      fromAddress: message.from.email,
      fromName: truncate(message.from.name, 200) || null,
      to: message.to,
      cc: message.cc,
      bcc: message.bcc,
      subject: truncate(message.subject, 500),
      bodyText: message.bodyText,
      bodyHtml: message.bodyHtml,
      snippet: truncate(message.snippet, 500),
      sentAt: message.sentAt,
      receivedAt: message.receivedAt,
      isRead: message.isRead,
      isOutbound: message.isOutbound,
      direction: message.isOutbound
        ? EmailDirection.OUTBOUND
        : EmailDirection.INBOUND,
      folder: message.folder,
      labels: message.labels,
      hasAttachments: message.hasAttachments,
      attachments: message.attachments,
      inReplyTo: message.inReplyTo,
      references: message.references,
    };
  }
}
