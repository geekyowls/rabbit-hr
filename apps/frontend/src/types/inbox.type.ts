import type { PaginatedResponse } from './common.type';
import type { MailboxProvider } from './mailbox.type';

export type EmailFolder = 'inbox' | 'sent' | 'drafts' | 'archive' | 'trash';

export type MovableEmailFolder = 'inbox' | 'archive' | 'trash';

export type EmailDirection = 'inbound' | 'outbound';

export type EmailDeliveryStatus = 'sent' | 'demo';

export type InboxSearchIn = 'all' | 'subject' | 'from_to';

export type InboxLinkedFilter = 'candidate' | 'client' | 'unlinked';

export interface EmailParticipant {
  email: string;
  name: string | null;
}

export interface EmailAttachment {
  filename: string;
  mimeType: string;
  size: number;
  providerAttachmentId: string | null;
}

export interface InboxThreadMailbox {
  id: string;
  emailAddress: string;
  displayName: string | null;
  provider: MailboxProvider;
  isShared: boolean;
  isDemo: boolean;
}

export interface InboxThread {
  id: string;
  mailboxId: string;
  mailbox: InboxThreadMailbox | null;
  subject: string;
  snippet: string;
  participants: EmailParticipant[];
  lastMessageAt: string;
  unreadCount: number;
  isUnread: boolean;
  messageCount: number;
  hasAttachments: boolean;
  folder: EmailFolder;
  labels: string[];
  isArchived: boolean;
  candidate: { id: string; firstName: string; lastName: string } | null;
  client: { id: string; name: string } | null;
  application: { id: string; jobId: string; jobTitle: string | null } | null;
}

export interface InboxMessage {
  id: string;
  threadId: string;
  mailboxId: string;
  fromAddress: string;
  fromName: string | null;
  to: EmailParticipant[];
  cc: EmailParticipant[];
  bcc: EmailParticipant[];
  subject: string;
  bodyText: string | null;
  bodyHtml: string | null;
  snippet: string;
  sentAt: string;
  receivedAt: string | null;
  isRead: boolean;
  isOutbound: boolean;
  direction: EmailDirection;
  folder: EmailFolder;
  hasAttachments: boolean;
  attachments: EmailAttachment[];
  inReplyTo: string | null;
  candidateId: string | null;
  clientId: string | null;
  clientContactId: string | null;
  deliveryStatus: EmailDeliveryStatus | null;
  sentBy: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
}

export interface InboxThreadDetail extends InboxThread {
  messages: InboxMessage[];
}

export interface ListInboxThreadsRequest {
  page: number;
  limit: number;
  mailboxId?: string;
  folder?: EmailFolder;
  unreadOnly?: boolean;
  search?: string;
  searchIn?: InboxSearchIn;
  linked?: InboxLinkedFilter;
  candidateId?: string;
  clientId?: string;
}

export interface InboxThreadListResponse extends PaginatedResponse<InboxThread> {
  connected: boolean;
}

export interface UpdateInboxThreadRequest {
  isRead?: boolean;
  isArchived?: boolean;
  folder?: MovableEmailFolder;
  candidateId?: string | null;
  clientId?: string | null;
  applicationId?: string | null;
}

export interface EmailRecipient {
  email: string;
  name?: string | null;
}

export interface SendInboxMessageRequest {
  mailboxId?: string;
  threadId?: string;
  inReplyToMessageId?: string;
  to?: EmailRecipient[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  subject?: string;
  html?: string;
  templateId?: string;
  candidateId?: string;
  applicationId?: string;
  clientId?: string;
}

export interface SendInboxMessageResponse {
  thread: InboxThread;
  message: InboxMessage;
  deliveryStatus: EmailDeliveryStatus;
}

export interface InboxStats {
  connected: boolean;
  unread: number;
  inboxCount: number;
  repliesLast7Days: number;
  medianFirstReplyHours: number | null;
  firstReplySampleSize: number;
}
