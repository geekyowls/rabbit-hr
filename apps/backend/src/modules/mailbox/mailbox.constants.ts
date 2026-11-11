export const MAILBOX_SYNC_JOB = 'sync';
export const MAILBOX_SYNC_EVERY_MS = 5 * 60 * 1000;
export const FIRST_SYNC_DAYS = 30;
export const FIRST_SYNC_LIMIT = 500;
export const INCREMENTAL_SYNC_LIMIT = 500;
export const OAUTH_STATE_MAX_AGE_MS = 10 * 60 * 1000;
export const TOKEN_REFRESH_SKEW_MS = 60 * 1000;
export const MAILBOX_CALLBACK_PATH = '/api/v1/mailboxes/oauth/callback';
export const INBOX_FRONTEND_PATH = '/dashboard/inbox';
export const DEMO_PROVIDER_ID_PREFIX = 'demo-';

export const GMAIL_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/gmail.modify',
];

export const OUTLOOK_SCOPES = [
  'offline_access',
  'User.Read',
  'Mail.ReadWrite',
  'Mail.Send',
];

export interface MailboxSyncJobData {
  connectionId: string;
}
