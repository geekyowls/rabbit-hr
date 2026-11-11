'use client';

import { useEffect, useRef } from 'react';
import {
  Archive,
  Building2,
  Inbox as InboxIcon,
  Mail,
  MailOpen,
  Paperclip,
  Trash2,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFormatters } from '@/hooks/use-formatters';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/patterns';
import type {
  EmailFolder,
  InboxThread,
  MovableEmailFolder,
} from '@/types/inbox.type';
import { threadRecipients, threadSenders } from './inbox-utils';

export type ThreadAction =
  | { kind: 'move'; folder: MovableEmailFolder }
  | { kind: 'read'; isRead: boolean };

export const linkChipClass =
  'inline-flex h-5 max-w-40 shrink-0 items-center gap-1 rounded-full bg-[#EDF1EE] px-2 text-[11px] font-medium text-[#3F6650] dark:bg-[#3F6650]/25 dark:text-[#8FBFA1]';

const quickActionClass =
  'flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/10 hover:text-foreground';

export function folderActions(folder: EmailFolder) {
  const moved = folder === 'archive' || folder === 'trash';
  return {
    canArchive: !moved,
    canRestore: moved,
    canTrash: folder !== 'trash',
  };
}

function useListDate() {
  const fmt = useFormatters();
  const today = fmt.dateLong(new Date());
  return (value: string) =>
    fmt.dateLong(value) === today
      ? fmt.time(value)
      : fmt.dateLong(value, { day: 'numeric', month: 'short' });
}

export function ThreadList({
  threads,
  loading,
  folder,
  selected,
  cursor,
  onToggle,
  onOpen,
  onAction,
  emptyTitle,
}: {
  threads: InboxThread[];
  loading: boolean;
  folder: EmailFolder;
  selected: Set<string>;
  cursor: number;
  onToggle: (id: string) => void;
  onOpen: (thread: InboxThread) => void;
  onAction: (thread: InboxThread, action: ThreadAction) => void;
  emptyTitle: string;
}) {
  const listDate = useListDate();
  const listRef = useRef<HTMLUListElement>(null);
  const { canArchive, canRestore, canTrash } = folderActions(folder);

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${cursor}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  if (loading) {
    return (
      <div className="space-y-1 p-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <EmptyState icon={<InboxIcon className="h-8 w-8" />} title={emptyTitle} />
    );
  }

  return (
    <ul ref={listRef}>
      {threads.map((thread, index) => {
        const checked = selected.has(thread.id);
        const unread = thread.isUnread;
        const rowBg = checked
          ? 'bg-[#EDF1EE] dark:bg-[#3F6650]/25'
          : unread
            ? 'bg-card'
            : 'bg-muted/50';
        const people =
          folder === 'sent' ? threadRecipients(thread) : threadSenders(thread);
        return (
          <li
            key={thread.id}
            data-index={index}
            className={cn(
              'group relative flex items-center border-b border-border transition-shadow hover:z-10 hover:shadow-md',
              rowBg,
              index === cursor &&
                'shadow-[inset_3px_0_0_#3F6650] dark:shadow-[inset_3px_0_0_#8FBFA1]',
            )}
          >
            <div className="flex shrink-0 items-center pl-3 pr-2">
              <Checkbox
                aria-label="Select conversation"
                checked={checked}
                onCheckedChange={() => onToggle(thread.id)}
              />
            </div>
            <button
              type="button"
              onClick={() => onOpen(thread)}
              className="flex min-w-0 flex-1 flex-col gap-0.5 py-2 pr-3 text-left text-sm sm:h-10 sm:flex-row sm:items-center sm:gap-3 sm:py-0"
            >
              <span
                className={cn(
                  'flex min-w-0 items-center gap-1 sm:w-48 sm:shrink-0',
                  unread
                    ? 'font-semibold text-foreground'
                    : 'text-foreground/80',
                )}
              >
                <span className="truncate">{people}</span>
                {thread.messageCount > 1 && (
                  <span className="shrink-0 text-xs font-normal text-muted-foreground">
                    ({thread.messageCount})
                  </span>
                )}
                {thread.mailbox?.isDemo && (
                  <span className="sr-only">Demo</span>
                )}
              </span>
              <span className="flex min-w-0 flex-1 items-center gap-1.5">
                {thread.candidate && (
                  <span className={linkChipClass}>
                    <User className="h-3 w-3 shrink-0" />
                    <span className="truncate">
                      {thread.candidate.firstName} {thread.candidate.lastName}
                    </span>
                  </span>
                )}
                {thread.client && (
                  <span className={linkChipClass}>
                    <Building2 className="h-3 w-3 shrink-0" />
                    <span className="truncate">{thread.client.name}</span>
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate">
                  <span
                    className={cn(
                      unread
                        ? 'font-semibold text-foreground'
                        : 'text-foreground/80',
                    )}
                  >
                    {thread.subject || '(no subject)'}
                  </span>
                  {thread.snippet && (
                    <span className="text-muted-foreground">
                      {' - '}
                      {thread.snippet}
                    </span>
                  )}
                </span>
                {thread.hasAttachments && (
                  <Paperclip
                    className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                    aria-label="Has attachments"
                  />
                )}
              </span>
              <span
                className={cn(
                  'absolute right-3 top-2 shrink-0 text-xs sm:static sm:w-16 sm:text-right md:group-hover:invisible',
                  unread
                    ? 'font-semibold text-foreground'
                    : 'text-muted-foreground',
                )}
              >
                {listDate(thread.lastMessageAt)}
              </span>
            </button>
            <div className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-card md:group-hover:block">
              <div
                className={cn('flex items-center gap-0.5 rounded-full', rowBg)}
              >
                {canArchive && (
                  <button
                    type="button"
                    aria-label="Archive"
                    title="Archive"
                    className={quickActionClass}
                    onClick={() =>
                      onAction(thread, { kind: 'move', folder: 'archive' })
                    }
                  >
                    <Archive className="h-4 w-4" />
                  </button>
                )}
                {canRestore && (
                  <button
                    type="button"
                    aria-label="Move to inbox"
                    title="Move to inbox"
                    className={quickActionClass}
                    onClick={() =>
                      onAction(thread, { kind: 'move', folder: 'inbox' })
                    }
                  >
                    <InboxIcon className="h-4 w-4" />
                  </button>
                )}
                {canTrash && (
                  <button
                    type="button"
                    aria-label="Delete"
                    title="Delete"
                    className={quickActionClass}
                    onClick={() =>
                      onAction(thread, { kind: 'move', folder: 'trash' })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  aria-label={unread ? 'Mark as read' : 'Mark as unread'}
                  title={unread ? 'Mark as read' : 'Mark as unread'}
                  className={quickActionClass}
                  onClick={() =>
                    onAction(thread, { kind: 'read', isRead: unread })
                  }
                >
                  {unread ? (
                    <MailOpen className="h-4 w-4" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
