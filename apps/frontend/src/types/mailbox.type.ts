export type MailboxProvider = 'gmail' | 'outlook';

export type MailboxConnectionStatus =
  'connected' | 'disconnected' | 'expired' | 'error';

export interface Mailbox {
  id: string;
  provider: MailboxProvider;
  emailAddress: string;
  displayName: string | null;
  isShared: boolean;
  isOwner: boolean;
  canManage: boolean;
  status: MailboxConnectionStatus;
  errorMessage: string | null;
  lastSyncedAt: string | null;
  syncEnabled: boolean;
  isDemo: boolean;
  createdAt: string;
}

export interface ConnectMailboxRequest {
  provider: MailboxProvider;
  shared?: boolean;
}

export interface ConnectMailboxResponse {
  authUrl: string;
}

export interface MailboxSyncResponse {
  queued: boolean;
  reason: string | null;
}
