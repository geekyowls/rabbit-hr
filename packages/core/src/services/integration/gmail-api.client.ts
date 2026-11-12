import { google, gmail_v1 } from 'googleapis';

export interface GmailAttachmentPart {
  filename: string;
  mimeType: string;
  size: number;
  attachmentId: string | null;
}

export interface GmailMessageDetail {
  id: string;
  threadId: string;
  historyId: string | null;
  labelIds: string[];
  internalDate: Date;
  snippet: string;
  headers: Record<string, string>;
  textBody: string | null;
  htmlBody: string | null;
  attachments: GmailAttachmentPart[];
}

export interface GmailHistoryChanges {
  messageIds: string[];
  deletedIds: string[];
  historyId: string;
}

export class GmailHistoryExpiredError extends Error {
  constructor() {
    super('Gmail history cursor expired');
  }
}

function decodeBase64Url(data: string): string {
  return Buffer.from(
    data.replace(/-/g, '+').replace(/_/g, '/'),
    'base64',
  ).toString('utf8');
}

function walkParts(
  part: gmail_v1.Schema$MessagePart | undefined,
  result: {
    text: string | null;
    html: string | null;
    attachments: GmailAttachmentPart[];
  },
): void {
  if (!part) {
    return;
  }
  const mimeType = part.mimeType ?? '';
  if (part.filename && part.body?.attachmentId) {
    result.attachments.push({
      filename: part.filename,
      mimeType,
      size: part.body.size ?? 0,
      attachmentId: part.body.attachmentId,
    });
  } else if (
    part.body?.data &&
    mimeType === 'text/plain' &&
    result.text === null
  ) {
    result.text = decodeBase64Url(part.body.data);
  } else if (
    part.body?.data &&
    mimeType === 'text/html' &&
    result.html === null
  ) {
    result.html = decodeBase64Url(part.body.data);
  }
  for (const child of part.parts ?? []) {
    walkParts(child, result);
  }
}

export class GmailApiClient {
  private readonly gmail: gmail_v1.Gmail;

  constructor(accessToken: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    this.gmail = google.gmail({ version: 'v1', auth });
  }

  async getProfile(): Promise<{ emailAddress: string; historyId: string }> {
    const { data } = await this.gmail.users.getProfile({ userId: 'me' });
    return {
      emailAddress: data.emailAddress ?? '',
      historyId: data.historyId ?? '',
    };
  }

  async listMessageIds(query: string, limit: number): Promise<string[]> {
    const ids: string[] = [];
    let pageToken: string | undefined;
    do {
      const { data } = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: Math.min(100, limit - ids.length),
        pageToken,
      });
      for (const message of data.messages ?? []) {
        if (message.id) {
          ids.push(message.id);
        }
      }
      pageToken = data.nextPageToken ?? undefined;
    } while (pageToken && ids.length < limit);
    return ids;
  }

  async listHistory(
    startHistoryId: string,
    limit: number,
  ): Promise<GmailHistoryChanges> {
    const changed = new Set<string>();
    const deleted = new Set<string>();
    let historyId = startHistoryId;
    let pageToken: string | undefined;
    try {
      do {
        const { data } = await this.gmail.users.history.list({
          userId: 'me',
          startHistoryId,
          pageToken,
          maxResults: 500,
        });
        for (const entry of data.history ?? []) {
          for (const item of entry.messagesAdded ?? []) {
            if (item.message?.id) changed.add(item.message.id);
          }
          for (const item of [
            ...(entry.labelsAdded ?? []),
            ...(entry.labelsRemoved ?? []),
          ]) {
            if (item.message?.id) changed.add(item.message.id);
          }
          for (const item of entry.messagesDeleted ?? []) {
            if (item.message?.id) deleted.add(item.message.id);
          }
        }
        historyId = data.historyId ?? historyId;
        pageToken = data.nextPageToken ?? undefined;
      } while (pageToken && changed.size < limit);
    } catch (error) {
      const status =
        (error as { code?: number; status?: number }).code ??
        (error as { status?: number }).status;
      if (status === 404) {
        throw new GmailHistoryExpiredError();
      }
      throw error;
    }
    for (const id of deleted) {
      changed.delete(id);
    }
    return {
      messageIds: [...changed].slice(0, limit),
      deletedIds: [...deleted],
      historyId,
    };
  }

  async getMessage(id: string): Promise<GmailMessageDetail | null> {
    try {
      const { data } = await this.gmail.users.messages.get({
        userId: 'me',
        id,
        format: 'full',
      });
      const headers: Record<string, string> = {};
      for (const header of data.payload?.headers ?? []) {
        if (header.name) {
          headers[header.name.toLowerCase()] = header.value ?? '';
        }
      }
      const parts = {
        text: null,
        html: null,
        attachments: [] as GmailAttachmentPart[],
      };
      walkParts(data.payload ?? undefined, parts);
      return {
        id: data.id ?? id,
        threadId: data.threadId ?? id,
        historyId: data.historyId ?? null,
        labelIds: data.labelIds ?? [],
        internalDate: new Date(Number(data.internalDate ?? Date.now())),
        snippet: data.snippet ?? '',
        headers,
        textBody: parts.text,
        htmlBody: parts.html,
        attachments: parts.attachments,
      };
    } catch (error) {
      const status = (error as { code?: number }).code;
      if (status === 404) {
        return null;
      }
      throw error;
    }
  }

  async sendRaw(
    raw: string,
    threadId?: string,
  ): Promise<{ id: string; threadId: string }> {
    const { data } = await this.gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw, ...(threadId && { threadId }) },
    });
    return { id: data.id ?? '', threadId: data.threadId ?? '' };
  }
}
