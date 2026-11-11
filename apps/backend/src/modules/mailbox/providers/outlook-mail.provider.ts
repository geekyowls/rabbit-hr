import { Injectable } from '@nestjs/common';
import type { EmailParticipant } from '@db/entities';
import { EmailFolder } from '@db/enums';
import {
  FIRST_SYNC_DAYS,
  FIRST_SYNC_LIMIT,
  INCREMENTAL_SYNC_LIMIT,
} from '../mailbox.constants';
import { normalizeEmail } from '../helpers/email-address';
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

const GRAPH_URL = 'https://graph.microsoft.com/v1.0';
const SYNC_FOLDERS = ['inbox', 'sentitems'] as const;
type SyncFolder = (typeof SYNC_FOLDERS)[number];
type OutlookCursor = Partial<Record<SyncFolder, string>>;

const MESSAGE_FIELDS = [
  'id',
  'conversationId',
  'internetMessageId',
  'subject',
  'bodyPreview',
  'body',
  'from',
  'toRecipients',
  'ccRecipients',
  'bccRecipients',
  'sentDateTime',
  'receivedDateTime',
  'isRead',
  'isDraft',
  'hasAttachments',
].join(',');

interface GraphRecipient {
  emailAddress?: { name?: string; address?: string };
}

interface GraphMessage {
  id: string;
  conversationId?: string;
  internetMessageId?: string;
  subject?: string;
  bodyPreview?: string;
  body?: { contentType?: string; content?: string };
  from?: GraphRecipient;
  toRecipients?: GraphRecipient[];
  ccRecipients?: GraphRecipient[];
  bccRecipients?: GraphRecipient[];
  sentDateTime?: string;
  receivedDateTime?: string;
  isRead?: boolean;
  isDraft?: boolean;
  hasAttachments?: boolean;
  '@removed'?: unknown;
}

interface GraphPage {
  value?: GraphMessage[];
  '@odata.nextLink'?: string;
  '@odata.deltaLink'?: string;
}

interface GraphAttachment {
  id?: string;
  name?: string;
  contentType?: string;
  size?: number;
}

class GraphError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function toParticipant(recipient?: GraphRecipient): EmailParticipant | null {
  const address = recipient?.emailAddress?.address;
  if (!address) return null;
  return {
    email: normalizeEmail(address),
    name: recipient?.emailAddress?.name || null,
  };
}

function toParticipants(recipients?: GraphRecipient[]): EmailParticipant[] {
  return (recipients ?? [])
    .map(toParticipant)
    .filter((participant): participant is EmailParticipant => !!participant);
}

function toRecipients(participants: EmailParticipant[]): GraphRecipient[] {
  return participants.map((participant) => ({
    emailAddress: {
      address: participant.email,
      ...(participant.name && { name: participant.name }),
    },
  }));
}

function parseCursor(cursor: string | null): OutlookCursor {
  if (!cursor) return {};
  try {
    return JSON.parse(cursor) as OutlookCursor;
  } catch {
    return {};
  }
}

@Injectable()
export class OutlookMailProvider implements MailProviderAdapter {
  async sync(
    accessToken: string,
    mailboxEmail: string,
    cursor: string | null,
  ): Promise<ProviderSyncResult> {
    const state = parseCursor(cursor);
    const isFirstSync = Object.keys(state).length === 0;
    const limit = isFirstSync ? FIRST_SYNC_LIMIT : INCREMENTAL_SYNC_LIMIT;
    const since = new Date(
      Date.now() - FIRST_SYNC_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();
    const nextState: OutlookCursor = {};
    const collected: Array<{ folder: SyncFolder; message: GraphMessage }> = [];
    const removed: string[] = [];

    for (const folder of SYNC_FOLDERS) {
      const initialUrl = `${GRAPH_URL}/me/mailFolders/${folder}/messages/delta?$select=${MESSAGE_FIELDS}&$filter=receivedDateTime ge ${since}`;
      let url: string | undefined = state[folder] ?? initialUrl;
      let folderCount = 0;
      while (url) {
        let page: GraphPage;
        try {
          page = await this.graph<GraphPage>(accessToken, url, {
            headers: {
              Prefer: 'odata.maxpagesize=50, outlook.body-content-type="html"',
            },
          });
        } catch (error) {
          if (
            error instanceof GraphError &&
            error.status === 410 &&
            url !== initialUrl
          ) {
            url = initialUrl;
            continue;
          }
          throw error;
        }
        for (const message of page.value ?? []) {
          if (message['@removed']) {
            removed.push(message.id);
          } else {
            collected.push({ folder, message });
            folderCount += 1;
          }
        }
        if (page['@odata.deltaLink']) {
          nextState[folder] = page['@odata.deltaLink'];
          url = undefined;
        } else if (folderCount >= limit) {
          nextState[folder] = page['@odata.nextLink'];
          url = undefined;
        } else {
          url = page['@odata.nextLink'];
        }
      }
    }

    const messages = await mapInBatches(collected, 10, async (item) =>
      this.toProviderMessage(
        accessToken,
        item.folder,
        item.message,
        mailboxEmail,
      ),
    );
    return {
      messages,
      removedProviderMessageIds: removed,
      cursor: JSON.stringify(nextState),
    };
  }

  async send(
    accessToken: string,
    email: OutgoingEmail,
  ): Promise<ProviderSendResult> {
    const content = {
      subject: email.subject,
      body: { contentType: 'HTML', content: email.html },
      toRecipients: toRecipients(email.to),
      ccRecipients: toRecipients(email.cc),
      bccRecipients: toRecipients(email.bcc),
    };
    const draft = email.replyToProviderMessageId
      ? await this.graph<GraphMessage>(
          accessToken,
          `${GRAPH_URL}/me/messages/${encodeURIComponent(email.replyToProviderMessageId)}/createReply`,
          { method: 'POST', body: '{}' },
        )
      : await this.graph<GraphMessage>(
          accessToken,
          `${GRAPH_URL}/me/messages`,
          {
            method: 'POST',
            body: JSON.stringify(content),
          },
        );
    if (email.replyToProviderMessageId) {
      await this.graph(
        accessToken,
        `${GRAPH_URL}/me/messages/${encodeURIComponent(draft.id)}`,
        { method: 'PATCH', body: JSON.stringify(content) },
      );
    }
    await this.graph(
      accessToken,
      `${GRAPH_URL}/me/messages/${encodeURIComponent(draft.id)}/send`,
      { method: 'POST', body: '{}' },
    );
    return {
      providerMessageId: draft.id,
      providerThreadId: draft.conversationId ?? draft.id,
      internetMessageId: draft.internetMessageId ?? null,
    };
  }

  private async toProviderMessage(
    accessToken: string,
    folder: SyncFolder,
    message: GraphMessage,
    mailboxEmail: string,
  ): Promise<ProviderMessage> {
    const from = toParticipant(message.from) ?? {
      email: 'unknown@unknown',
      name: null,
    };
    const isOutbound =
      folder === 'sentitems' || from.email === normalizeEmail(mailboxEmail);
    const isHtml = message.body?.contentType?.toLowerCase() === 'html';
    const bodyHtml = isHtml ? sanitizeEmailHtml(message.body?.content) : null;
    const sentAt = new Date(
      message.sentDateTime ?? message.receivedDateTime ?? Date.now(),
    );
    const attachments = message.hasAttachments
      ? await this.listAttachments(accessToken, message.id)
      : [];
    return {
      providerMessageId: message.id,
      providerThreadId: message.conversationId ?? message.id,
      internetMessageId: message.internetMessageId ?? null,
      inReplyTo: null,
      references: null,
      subject: message.subject ?? '',
      from,
      to: toParticipants(message.toRecipients),
      cc: toParticipants(message.ccRecipients),
      bcc: toParticipants(message.bccRecipients),
      bodyText: isHtml
        ? emailHtmlToText(bodyHtml) || null
        : (message.body?.content ?? null),
      bodyHtml,
      snippet: message.bodyPreview ?? '',
      sentAt,
      receivedAt: isOutbound
        ? null
        : new Date(message.receivedDateTime ?? sentAt),
      isRead: message.isRead ?? true,
      isOutbound,
      folder: message.isDraft
        ? EmailFolder.DRAFTS
        : folder === 'sentitems'
          ? EmailFolder.SENT
          : EmailFolder.INBOX,
      labels: [folder],
      hasAttachments: !!message.hasAttachments,
      attachments,
    };
  }

  private async listAttachments(accessToken: string, messageId: string) {
    try {
      const data = await this.graph<{ value?: GraphAttachment[] }>(
        accessToken,
        `${GRAPH_URL}/me/messages/${encodeURIComponent(messageId)}/attachments?$select=id,name,contentType,size`,
      );
      return (data.value ?? []).map((attachment) => ({
        filename: attachment.name ?? 'attachment',
        mimeType: attachment.contentType ?? 'application/octet-stream',
        size: attachment.size ?? 0,
        providerAttachmentId: attachment.id ?? null,
      }));
    } catch {
      return [];
    }
  }

  private async graph<T = unknown>(
    accessToken: string,
    url: string,
    init: RequestInit = {},
  ): Promise<T> {
    const response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...(init.headers as Record<string, string> | undefined),
      },
    });
    if (response.status === 401) {
      throw new MailboxAuthError('Outlook rejected the stored credentials');
    }
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new GraphError(
        response.status,
        `Microsoft Graph request failed (${response.status}) ${detail.slice(0, 200)}`,
      );
    }
    if (response.status === 202 || response.status === 204) {
      return {} as T;
    }
    return (await response.json()) as T;
  }
}
