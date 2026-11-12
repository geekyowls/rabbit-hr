import { Injectable } from '@nestjs/common';
import {
  GmailApiClient,
  GmailHistoryExpiredError,
  GmailMessageDetail,
} from '@boilerplate/core';
import { EmailFolder } from '@db/enums';
import {
  FIRST_SYNC_DAYS,
  FIRST_SYNC_LIMIT,
  INCREMENTAL_SYNC_LIMIT,
} from '../mailbox.constants';
import { normalizeEmail, parseAddressList } from '../helpers/email-address';
import { buildMimeMessage } from '../helpers/mime-builder';
import {
  emailHtmlToText,
  sanitizeEmailHtml,
} from '../helpers/sanitize-email-html';
import { mapInBatches } from './map-in-batches';
import {
  MailboxAuthError,
  MailProviderAdapter,
  OutgoingEmail,
  ProviderMessage,
  ProviderSendResult,
  ProviderSyncResult,
} from './mail-provider.types';

function gmailFolder(labels: string[]): EmailFolder {
  if (labels.includes('TRASH') || labels.includes('SPAM')) {
    return EmailFolder.TRASH;
  }
  if (labels.includes('DRAFT')) return EmailFolder.DRAFTS;
  if (labels.includes('INBOX')) return EmailFolder.INBOX;
  if (labels.includes('SENT')) return EmailFolder.SENT;
  return EmailFolder.ARCHIVE;
}

function isAuthFailure(error: unknown): boolean {
  const status =
    (error as { code?: number }).code ?? (error as { status?: number }).status;
  return status === 401;
}

@Injectable()
export class GmailMailProvider implements MailProviderAdapter {
  async sync(
    accessToken: string,
    mailboxEmail: string,
    cursor: string | null,
  ): Promise<ProviderSyncResult> {
    const client = new GmailApiClient(accessToken);
    try {
      let ids: string[];
      let nextCursor: string;
      let removed: string[] = [];
      try {
        if (!cursor) throw new GmailHistoryExpiredError();
        const changes = await client.listHistory(
          cursor,
          INCREMENTAL_SYNC_LIMIT,
        );
        ids = changes.messageIds;
        removed = changes.deletedIds;
        nextCursor = changes.historyId;
      } catch (error) {
        if (!(error instanceof GmailHistoryExpiredError)) throw error;
        const profile = await client.getProfile();
        ids = await client.listMessageIds(
          `newer_than:${FIRST_SYNC_DAYS}d -in:chats`,
          FIRST_SYNC_LIMIT,
        );
        nextCursor = profile.historyId;
      }
      const details = await mapInBatches(ids, 10, (id) =>
        client.getMessage(id),
      );
      const messages = details
        .filter((detail): detail is GmailMessageDetail => detail !== null)
        .map((detail) => this.toProviderMessage(detail, mailboxEmail));
      return {
        messages,
        removedProviderMessageIds: removed,
        cursor: nextCursor,
      };
    } catch (error) {
      if (isAuthFailure(error)) {
        throw new MailboxAuthError('Gmail rejected the stored credentials');
      }
      throw error;
    }
  }

  async send(
    accessToken: string,
    email: OutgoingEmail,
  ): Promise<ProviderSendResult> {
    const client = new GmailApiClient(accessToken);
    try {
      const result = await client.sendRaw(
        buildMimeMessage(email),
        email.providerThreadId ?? undefined,
      );
      return {
        providerMessageId: result.id,
        providerThreadId: result.threadId,
        internetMessageId: null,
      };
    } catch (error) {
      if (isAuthFailure(error)) {
        throw new MailboxAuthError('Gmail rejected the stored credentials');
      }
      throw error;
    }
  }

  private toProviderMessage(
    detail: GmailMessageDetail,
    mailboxEmail: string,
  ): ProviderMessage {
    const { headers, labelIds } = detail;
    const from = parseAddressList(headers.from)[0] ?? {
      email: 'unknown@unknown',
      name: null,
    };
    const isOutbound =
      labelIds.includes('SENT') || from.email === normalizeEmail(mailboxEmail);
    const bodyHtml = sanitizeEmailHtml(detail.htmlBody);
    return {
      providerMessageId: detail.id,
      providerThreadId: detail.threadId,
      internetMessageId: headers['message-id'] || null,
      inReplyTo: headers['in-reply-to'] || null,
      references: headers.references || null,
      subject: headers.subject ?? '',
      from,
      to: parseAddressList(headers.to),
      cc: parseAddressList(headers.cc),
      bcc: parseAddressList(headers.bcc),
      bodyText: detail.textBody ?? (emailHtmlToText(bodyHtml) || null),
      bodyHtml,
      snippet: emailHtmlToText(detail.snippet),
      sentAt: detail.internalDate,
      receivedAt: isOutbound ? null : detail.internalDate,
      isRead: !labelIds.includes('UNREAD'),
      isOutbound,
      folder: gmailFolder(labelIds),
      labels: labelIds,
      hasAttachments: detail.attachments.length > 0,
      attachments: detail.attachments.map((attachment) => ({
        filename: attachment.filename,
        mimeType: attachment.mimeType,
        size: attachment.size,
        providerAttachmentId: attachment.attachmentId,
      })),
    };
  }
}
