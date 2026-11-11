'use client';

import { Building2, Paperclip, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFormatters } from '@/hooks/use-formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/patterns';
import type { InboxThread } from '@/types/inbox.type';
import { participantLabel } from './inbox-utils';

function threadPeople(thread: InboxThread) {
  const own = thread.mailbox?.emailAddress.toLowerCase();
  const others = thread.participants.filter(
    (p) => p.email.toLowerCase() !== own,
  );
  const list = others.length > 0 ? others : thread.participants;
  return list.map(participantLabel).join(', ');
}

export function ThreadList({
  threads,
  loading,
  selectedId,
  onSelect,
  emptyTitle,
}: {
  threads: InboxThread[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (thread: InboxThread) => void;
  emptyTitle: string;
}) {
  const fmt = useFormatters();

  if (loading) {
    return (
      <div className="space-y-2 p-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (threads.length === 0) {
    return <EmptyState compact title={emptyTitle} />;
  }

  return (
    <ul className="divide-y divide-border">
      {threads.map((thread) => {
        const active = thread.id === selectedId;
        return (
          <li key={thread.id}>
            <button
              type="button"
              onClick={() => onSelect(thread)}
              className={cn(
                'flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition-colors',
                active
                  ? 'bg-[#EDF1EE] dark:bg-[#3F6650]/25'
                  : 'hover:bg-muted/60',
              )}
            >
              <span className="flex items-center gap-2">
                {thread.isUnread && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-[#3F6650] dark:bg-[#8FBFA1]" />
                )}
                <span
                  className={cn(
                    'min-w-0 flex-1 truncate text-sm',
                    thread.isUnread ? 'font-semibold' : 'font-medium',
                  )}
                >
                  {threadPeople(thread)}
                </span>
                {thread.messageCount > 1 && (
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {thread.messageCount}
                  </span>
                )}
                <span className="shrink-0 text-xs text-muted-foreground">
                  {fmt.relative(thread.lastMessageAt)}
                </span>
              </span>
              <span
                className={cn(
                  'truncate text-sm',
                  thread.isUnread ? 'text-foreground' : 'text-foreground/80',
                )}
              >
                {thread.subject || '(no subject)'}
              </span>
              <span className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                  {thread.snippet}
                </span>
                {thread.hasAttachments && (
                  <Paperclip className="h-3 w-3 shrink-0 text-muted-foreground" />
                )}
                {thread.candidate && (
                  <User
                    className="h-3 w-3 shrink-0 text-[#3F6650] dark:text-[#8FBFA1]"
                    aria-label="Linked to candidate"
                  />
                )}
                {thread.client && (
                  <Building2
                    className="h-3 w-3 shrink-0 text-[#3F6650] dark:text-[#8FBFA1]"
                    aria-label="Linked to client"
                  />
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
