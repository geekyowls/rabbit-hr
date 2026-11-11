import { NotFoundException } from '@nestjs/common';
import {
  EmailMessageEntity,
  EmailParticipant,
  EmailThreadEntity,
} from '@db/entities';
import {
  EmailMessageRepository,
  EmailThreadRepository,
} from '@db/repositories';

export interface InboxThreadRow {
  id: string;
  mailboxId: string;
  mailbox: {
    id: string;
    emailAddress: string;
    displayName: string | null;
    provider: string;
    isShared: boolean;
    isDemo: boolean;
  } | null;
  subject: string;
  snippet: string;
  participants: EmailParticipant[];
  lastMessageAt: Date;
  unreadCount: number;
  isUnread: boolean;
  messageCount: number;
  hasAttachments: boolean;
  folder: string;
  labels: string[];
  isArchived: boolean;
  candidate: { id: string; firstName: string; lastName: string } | null;
  client: { id: string; name: string } | null;
  application: { id: string; jobId: string; jobTitle: string | null } | null;
}

export function buildThreadQuery(
  repository: EmailThreadRepository,
  organizationId: string,
  mailboxIds: string[],
) {
  return repository
    .createQueryBuilder('thread')
    .leftJoin('thread.mailbox', 'mailbox')
    .addSelect([
      'mailbox.id',
      'mailbox.emailAddress',
      'mailbox.displayName',
      'mailbox.provider',
      'mailbox.isShared',
      'mailbox.isDemo',
    ])
    .leftJoin('thread.candidate', 'candidate')
    .addSelect(['candidate.id', 'candidate.firstName', 'candidate.lastName'])
    .leftJoin('thread.client', 'client')
    .addSelect(['client.id', 'client.name'])
    .leftJoin('thread.application', 'application')
    .addSelect(['application.id', 'application.jobId'])
    .leftJoin('application.job', 'job')
    .addSelect(['job.id', 'job.title'])
    .where('thread.organizationId = :organizationId', { organizationId })
    .andWhere('thread.mailboxId IN (:...mailboxIds)', { mailboxIds });
}

export async function findAccessibleThread(
  repository: EmailThreadRepository,
  organizationId: string,
  mailboxIds: string[],
  threadId: string,
): Promise<EmailThreadEntity> {
  const thread =
    mailboxIds.length > 0
      ? await buildThreadQuery(repository, organizationId, mailboxIds)
          .andWhere('thread.id = :threadId', { threadId })
          .getOne()
      : null;
  if (!thread) {
    throw new NotFoundException('Thread not found');
  }
  return thread;
}

export function toThreadRow(thread: EmailThreadEntity): InboxThreadRow {
  const { mailbox, candidate, client, application } = thread;
  return {
    id: thread.id,
    mailboxId: thread.mailboxId,
    mailbox: mailbox
      ? {
          id: mailbox.id,
          emailAddress: mailbox.emailAddress,
          displayName: mailbox.displayName,
          provider: mailbox.provider,
          isShared: mailbox.isShared,
          isDemo: mailbox.isDemo,
        }
      : null,
    subject: thread.subject,
    snippet: thread.snippet,
    participants: thread.participants,
    lastMessageAt: thread.lastMessageAt,
    unreadCount: thread.unreadCount,
    isUnread: thread.unreadCount > 0,
    messageCount: thread.messageCount,
    hasAttachments: thread.hasAttachments,
    folder: thread.folder,
    labels: thread.labels,
    isArchived: thread.isArchived,
    candidate: candidate
      ? {
          id: candidate.id,
          firstName: candidate.firstName,
          lastName: candidate.lastName,
        }
      : null,
    client: client ? { id: client.id, name: client.name } : null,
    application: application
      ? {
          id: application.id,
          jobId: application.jobId,
          jobTitle: application.job?.title ?? null,
        }
      : null,
  };
}

export function loadThreadMessages(
  repository: EmailMessageRepository,
  threadId: string,
): Promise<EmailMessageEntity[]> {
  return repository
    .createQueryBuilder('message')
    .leftJoin('message.sentByUser', 'sentBy')
    .addSelect([
      'sentBy.id',
      'sentBy.firstName',
      'sentBy.lastName',
      'sentBy.email',
    ])
    .where('message.threadId = :threadId', { threadId })
    .orderBy('message.sentAt', 'ASC')
    .getMany();
}

export function toMessageRow(message: EmailMessageEntity) {
  const { sentByUser } = message;
  return {
    id: message.id,
    threadId: message.threadId,
    mailboxId: message.mailboxId,
    fromAddress: message.fromAddress,
    fromName: message.fromName,
    to: message.to,
    cc: message.cc,
    bcc: message.bcc,
    subject: message.subject,
    bodyText: message.bodyText,
    bodyHtml: message.bodyHtml,
    snippet: message.snippet,
    sentAt: message.sentAt,
    receivedAt: message.receivedAt,
    isRead: message.isRead,
    isOutbound: message.isOutbound,
    direction: message.direction,
    folder: message.folder,
    hasAttachments: message.hasAttachments,
    attachments: message.attachments,
    inReplyTo: message.inReplyTo,
    candidateId: message.candidateId,
    clientId: message.clientId,
    clientContactId: message.clientContactId,
    deliveryStatus: message.deliveryStatus,
    sentBy: sentByUser
      ? {
          id: sentByUser.id,
          firstName: sentByUser.firstName,
          lastName: sentByUser.lastName,
          email: sentByUser.email,
        }
      : null,
  };
}
