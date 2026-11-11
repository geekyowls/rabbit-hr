import { MailboxProvider } from '@db/enums';

export interface MailboxOAuthState {
  organizationId: string;
  userId: string;
  provider: MailboxProvider;
  shared: boolean;
  timestamp: number;
  nonce: string;
}

export function encodeOAuthState(state: MailboxOAuthState): string {
  return Buffer.from(JSON.stringify(state)).toString('base64url');
}

export function decodeOAuthState(value: string): MailboxOAuthState | null {
  try {
    const parsed = JSON.parse(
      Buffer.from(value, 'base64url').toString('utf8'),
    ) as Partial<MailboxOAuthState>;
    if (
      typeof parsed.organizationId !== 'string' ||
      typeof parsed.userId !== 'string' ||
      typeof parsed.nonce !== 'string' ||
      typeof parsed.timestamp !== 'number' ||
      !Object.values(MailboxProvider).includes(parsed.provider!)
    ) {
      return null;
    }
    return parsed as MailboxOAuthState;
  } catch {
    return null;
  }
}
