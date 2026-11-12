import type { EmailAttachmentMeta, EmailParticipant } from '@db/entities';
import type { EmailFolder } from '@db/enums';

export interface MailboxTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface MailboxAccount {
  emailAddress: string;
  displayName: string | null;
}

export interface ProviderMessage {
  providerMessageId: string;
  providerThreadId: string;
  internetMessageId: string | null;
  inReplyTo: string | null;
  references: string | null;
  subject: string;
  from: EmailParticipant;
  to: EmailParticipant[];
  cc: EmailParticipant[];
  bcc: EmailParticipant[];
  bodyText: string | null;
  bodyHtml: string | null;
  snippet: string;
  sentAt: Date;
  receivedAt: Date | null;
  isRead: boolean;
  isOutbound: boolean;
  folder: EmailFolder;
  labels: string[];
  hasAttachments: boolean;
  attachments: EmailAttachmentMeta[];
}

export interface ProviderSyncResult {
  messages: ProviderMessage[];
  removedProviderMessageIds: string[];
  cursor: string | null;
}

export interface OutgoingEmail {
  from: EmailParticipant;
  to: EmailParticipant[];
  cc: EmailParticipant[];
  bcc: EmailParticipant[];
  subject: string;
  html: string;
  text: string;
  inReplyTo: string | null;
  references: string | null;
  providerThreadId: string | null;
  replyToProviderMessageId: string | null;
}

export interface ProviderSendResult {
  providerMessageId: string;
  providerThreadId: string;
  internetMessageId: string | null;
}

export interface MailProviderAdapter {
  sync(
    accessToken: string,
    mailboxEmail: string,
    cursor: string | null,
  ): Promise<ProviderSyncResult>;
  send(accessToken: string, email: OutgoingEmail): Promise<ProviderSendResult>;
}

export class MailboxAuthError extends Error {}
