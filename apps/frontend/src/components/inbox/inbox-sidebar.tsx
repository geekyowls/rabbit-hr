'use client';

import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Mailbox } from '@/types/mailbox.type';
import type { EmailFolder, InboxStats } from '@/types/inbox.type';
import { FOLDERS, formatWaitHours } from './inbox-utils';

export const ALL_MAILBOXES = 'all';

interface InboxNavProps {
  folder: EmailFolder;
  onFolderChange: (folder: EmailFolder) => void;
  showDrafts: boolean;
  unread: number;
  mailboxes: Mailbox[];
  mailboxId: string;
  onMailboxChange: (id: string) => void;
  canSend: boolean;
  onCompose: () => void;
}

function visibleFolders(showDrafts: boolean, folder: EmailFolder) {
  return FOLDERS.filter(
    (f) => f.value !== 'drafts' || showDrafts || folder === 'drafts',
  );
}

function ComposeButton({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-12 items-center gap-3 rounded-2xl bg-[#EDF1EE] px-5 text-sm font-medium text-[#2F4D3C] shadow-sm transition-shadow hover:shadow-md dark:bg-[#3F6650]/30 dark:text-[#CFE3D6]',
        className,
      )}
    >
      <Pencil className="h-4 w-4" />
      Compose
    </button>
  );
}

export function InboxSidebar({
  folder,
  onFolderChange,
  showDrafts,
  unread,
  mailboxes,
  mailboxId,
  onMailboxChange,
  canSend,
  onCompose,
  stats,
}: InboxNavProps & { stats: InboxStats | undefined }) {
  return (
    <aside className="hidden w-[220px] shrink-0 flex-col md:flex">
      {canSend && <ComposeButton onClick={onCompose} className="mb-4 w-fit" />}
      <nav className="space-y-0.5">
        {visibleFolders(showDrafts, folder).map((f) => {
          const active = f.value === folder;
          const bold = f.value === 'inbox' && unread > 0;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => onFolderChange(f.value)}
              className={cn(
                'flex h-8 w-full items-center gap-4 rounded-r-full pl-4 pr-3 text-sm transition-colors',
                active
                  ? 'bg-[#DCE7DF] font-semibold text-[#2F4D3C] dark:bg-[#3F6650]/40 dark:text-[#CFE3D6]'
                  : 'text-foreground/80 hover:bg-muted',
                bold && 'font-semibold text-foreground',
              )}
            >
              <f.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">{f.label}</span>
              {bold && (
                <span className="text-xs font-semibold tabular-nums">
                  {unread}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {mailboxes.length > 1 && (
        <div className="mt-5">
          <p className="px-4 pb-1 text-xs font-medium text-muted-foreground">
            Mailboxes
          </p>
          <div className="space-y-0.5">
            {[
              { id: ALL_MAILBOXES, label: 'All mailboxes' },
              ...mailboxes.map((m) => ({ id: m.id, label: m.emailAddress })),
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                title={m.label}
                onClick={() => onMailboxChange(m.id)}
                className={cn(
                  'flex h-8 w-full items-center gap-3 rounded-r-full pl-4 pr-3 text-sm transition-colors',
                  m.id === mailboxId
                    ? 'bg-muted font-medium text-foreground'
                    : 'text-foreground/80 hover:bg-muted',
                )}
              >
                <span
                  className={cn(
                    'h-2 w-2 shrink-0 rounded-full',
                    m.id === mailboxId
                      ? 'bg-[#3F6650] dark:bg-[#8FBFA1]'
                      : 'bg-muted-foreground/40',
                  )}
                />
                <span className="truncate">{m.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto space-y-1 px-4 pt-4 text-xs text-muted-foreground">
        <p>
          Replies sent, last 7 days:{' '}
          <span className="font-medium text-foreground">
            {stats?.repliesLast7Days ?? '-'}
          </span>
        </p>
        <p>
          Typical reply time:{' '}
          <span className="font-medium text-foreground">
            {formatWaitHours(stats?.medianFirstReplyHours ?? null)}
          </span>
        </p>
      </div>
    </aside>
  );
}

export function InboxMobileNav({
  folder,
  onFolderChange,
  showDrafts,
  unread,
  mailboxes,
  mailboxId,
  onMailboxChange,
  canSend,
  onCompose,
}: InboxNavProps) {
  return (
    <div className="flex shrink-0 items-center gap-2 md:hidden">
      <Select
        value={folder}
        onValueChange={(v) => onFolderChange(v as EmailFolder)}
      >
        <SelectTrigger className="h-9 w-36" aria-label="Folder">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {visibleFolders(showDrafts, folder).map((f) => (
            <SelectItem key={f.value} value={f.value}>
              {f.value === 'inbox' && unread > 0
                ? `${f.label} (${unread})`
                : f.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {mailboxes.length > 1 && (
        <Select value={mailboxId} onValueChange={onMailboxChange}>
          <SelectTrigger className="h-9 min-w-0 flex-1" aria-label="Mailbox">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_MAILBOXES}>All mailboxes</SelectItem>
            {mailboxes.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.emailAddress}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {canSend && (
        <ComposeButton onClick={onCompose} className="ml-auto h-9 px-4" />
      )}
    </div>
  );
}
