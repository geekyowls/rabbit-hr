import {
  Archive,
  File,
  Inbox,
  Send,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import type {
  EmailFolder,
  EmailParticipant,
  EmailRecipient,
  InboxLinkedFilter,
  InboxMessage,
  InboxSearchIn,
  InboxThread,
} from '@/types/inbox.type';

export const FOLDERS: {
  value: EmailFolder;
  label: string;
  icon: LucideIcon;
}[] = [
  { value: 'inbox', label: 'Inbox', icon: Inbox },
  { value: 'sent', label: 'Sent', icon: Send },
  { value: 'drafts', label: 'Drafts', icon: File },
  { value: 'archive', label: 'Archive', icon: Archive },
  { value: 'trash', label: 'Trash', icon: Trash2 },
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

export function isOwnAddress(email: string, ownAddress: string | undefined) {
  return !!ownAddress && email.toLowerCase() === ownAddress.toLowerCase();
}

function firstName(p: EmailParticipant) {
  const name = p.name?.trim();
  return name ? name.split(/\s+/)[0] : p.email.split('@')[0];
}

export function threadSenders(thread: InboxThread) {
  const own = thread.mailbox?.emailAddress;
  const others = thread.participants.filter((p) => !isOwnAddress(p.email, own));
  const hasOwn = others.length < thread.participants.length;
  if (others.length === 0) return hasOwn ? 'me' : '(no sender)';
  const names =
    others.length === 1 && !hasOwn
      ? [participantLabel(others[0])]
      : others.map(firstName);
  return [...names, ...(hasOwn ? ['me'] : [])].join(', ');
}

export function threadRecipients(thread: InboxThread) {
  const own = thread.mailbox?.emailAddress;
  const others = thread.participants.filter((p) => !isOwnAddress(p.email, own));
  return others.length > 0
    ? `To: ${others.map(participantLabel).join(', ')}`
    : 'To: me';
}

export function recipientNames(
  list: EmailParticipant[],
  ownAddress: string | undefined,
) {
  return list
    .map((p) =>
      isOwnAddress(p.email, ownAddress) ? 'me' : participantLabel(p),
    )
    .join(', ');
}
