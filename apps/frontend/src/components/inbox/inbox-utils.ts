import type {
  EmailFolder,
  EmailParticipant,
  EmailRecipient,
  InboxLinkedFilter,
  InboxMessage,
  InboxSearchIn,
} from '@/types/inbox.type';

export type InboxLayout = 'side' | 'stacked';

const LAYOUT_KEY = 'inbox-layout';

export function readInboxLayout(): InboxLayout {
  try {
    return localStorage.getItem(LAYOUT_KEY) === 'stacked' ? 'stacked' : 'side';
  } catch {
    return 'side';
  }
}

export function saveInboxLayout(layout: InboxLayout) {
  try {
    localStorage.setItem(LAYOUT_KEY, layout);
  } catch {
    return;
  }
}

export const FOLDERS: { value: EmailFolder; label: string }[] = [
  { value: 'inbox', label: 'Inbox' },
  { value: 'sent', label: 'Sent' },
  { value: 'drafts', label: 'Drafts' },
  { value: 'archive', label: 'Archive' },
  { value: 'trash', label: 'Trash' },
];

export const SEARCH_IN_OPTIONS: { value: InboxSearchIn; label: string }[] = [
  { value: 'all', label: 'Everything' },
  { value: 'from_to', label: 'From or to' },
  { value: 'subject', label: 'Subject' },
];

export const LINKED_OPTIONS: {
  value: InboxLinkedFilter | 'any';
  label: string;
}[] = [
  { value: 'any', label: 'Any' },
  { value: 'candidate', label: 'Linked to candidate' },
  { value: 'client', label: 'Linked to client' },
  { value: 'unlinked', label: 'Unlinked' },
];

export function participantLabel(p: EmailParticipant) {
  return p.name?.trim() || p.email;
}

export function senderLabel(message: InboxMessage) {
  return message.fromName?.trim() || message.fromAddress;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function textToHtml(text: string) {
  return text
    .trim()
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export function splitEmails(value: string) {
  return value
    .split(/[,;\s]+/)
    .map((v) => v.trim())
    .filter(Boolean);
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function emailListValid(value: string) {
  return splitEmails(value).every((e) => EMAIL_PATTERN.test(e));
}

export function toRecipients(value: string): EmailRecipient[] {
  return splitEmails(value).map((email) => ({ email }));
}

function uniqueEmails(list: EmailParticipant[], exclude: string[]) {
  const skip = new Set(exclude.map((e) => e.toLowerCase()));
  const out: string[] = [];
  for (const p of list) {
    const email = p.email.toLowerCase();
    if (skip.has(email)) continue;
    skip.add(email);
    out.push(p.email);
  }
  return out;
}

export function replyRecipients(
  message: InboxMessage,
  ownAddress: string,
  all: boolean,
) {
  const primary: EmailParticipant[] = message.isOutbound
    ? message.to
    : [{ email: message.fromAddress, name: message.fromName }];
  const to = uniqueEmails(primary, [ownAddress]);
  const cc = all
    ? uniqueEmails(
        [...(message.isOutbound ? [] : message.to), ...message.cc],
        [ownAddress, ...to],
      )
    : [];
  return { to: to.join(', '), cc: cc.join(', ') };
}

export function replySubject(subject: string) {
  return /^re:/i.test(subject.trim()) ? subject : `Re: ${subject}`;
}

export function formatWaitHours(hours: number | null) {
  if (hours === null) return '-';
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} min`;
  if (hours < 48) return `${Math.round(hours * 10) / 10} h`;
  return `${Math.round((hours / 24) * 10) / 10} d`;
}
