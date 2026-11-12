'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Archive,
  ArrowLeft,
  Briefcase,
  Building2,
  ChevronLeft,
  ChevronRight,
  Inbox as InboxIcon,
  Mail,
  Paperclip,
  Reply,
  ReplyAll,
  Trash2,
  User,
  UserPlus,
  X,
} from 'lucide-react';
import { cn, formatBytes } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { useFormatters } from '@/hooks/use-formatters';
import {
  useInboxThreadQuery,
  useUpdateInboxThreadMutation,
} from '@/hooks/queries';
import { EmptyState } from '@/components/patterns';
import { InitialsAvatar } from '@/components/ui/initials-avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { errorMessage } from '@/components/applications/application-meta';
import type { Mailbox } from '@/types/mailbox.type';
import type {
  InboxMessage,
  UpdateInboxThreadRequest,
} from '@/types/inbox.type';
import { CandidateLinkPicker } from './candidate-link-picker';
import { ComposeForm } from './compose-form';
import { MessageBody } from './message-body';
import { recipientNames, senderLabel } from './inbox-utils';
import { folderActions, linkChipClass } from './thread-list';

const barButton =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40';

function BarButton({
  icon: Icon,
  label,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={barButton}
      {...props}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function MessageItem({
  message,
  ownAddress,
  expanded,
  onToggle,
}: {
  message: InboxMessage;
  ownAddress: string | undefined;
  expanded: boolean;
  onToggle: () => void;
}) {
  const fmt = useFormatters();
  const name = senderLabel(message);
  const date = `${fmt.dateLong(message.sentAt, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}, ${fmt.time(message.sentAt)}`;

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 border-b border-border px-4 py-2.5 text-left hover:bg-muted/40"
      >
        <InitialsAvatar name={name} className="h-8 w-8 text-xs" />
        <span className="w-40 shrink-0 truncate text-sm font-semibold">
          {name}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
          {message.snippet}
        </span>
        <span className="shrink-0 text-xs text-muted-foreground">{date}</span>
      </button>
    );
  }

  const to = recipientNames(message.to, ownAddress);
  const cc = recipientNames(message.cc, ownAddress);

  return (
    <article className="border-b border-border px-4 py-3">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-3 text-left"
      >
        <InitialsAvatar name={name} className="h-10 w-10 text-sm" />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-1.5">
            <span className="text-sm font-semibold">{name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {`<${message.fromAddress}>`}
            </span>
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            to {to || 'me'}
            {cc && `, cc ${cc}`}
          </span>
        </span>
        <span className="shrink-0 text-right text-xs text-muted-foreground">
          {date}
          {message.deliveryStatus === 'demo' && (
            <span className="block">Demo, not sent</span>
          )}
        </span>
      </button>
      <div className="mt-3 space-y-3 sm:pl-[52px]">
        <MessageBody html={message.bodyHtml} text={message.bodyText} />
        {message.attachments.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {message.attachments.map((a, i) => (
              <li
                key={`${a.filename}-${i}`}
                className="inline-flex h-8 max-w-full items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2.5 text-xs"
              >
                <Paperclip className="h-3 w-3 shrink-0 text-muted-foreground" />
                <span className="truncate">{a.filename}</span>
                <span className="shrink-0 text-muted-foreground">
                  {formatBytes(a.size, 0)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

export function ThreadView({
  threadId,
  canSend,
  mailboxes,
  position,
  total,
  onPrev,
  onNext,
  onBack,
  onOpenCandidate,
}: {
  threadId: string;
  canSend: boolean;
  mailboxes: Mailbox[];
  position: number | null;
  total: number;
  onPrev?: () => void;
  onNext?: () => void;
  onBack: () => void;
  onOpenCandidate: (candidateId: string) => void;
}) {
  const { data: thread, isLoading, isError } = useInboxThreadQuery(threadId);
  const update = useUpdateInboxThreadMutation();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [reply, setReply] = useState<{
    message: InboxMessage;
    all: boolean;
  } | null>(null);
  const replyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reply) replyRef.current?.scrollIntoView({ block: 'nearest' });
  }, [reply]);

  const apply = async (
    data: UpdateInboxThreadRequest,
    success: string,
    leave = false,
  ) => {
    try {
      await update.mutateAsync({ id: threadId, data });
      toast.success(success);
      if (leave) onBack();
    } catch (err) {
      toast.error('Could not update conversation', errorMessage(err));
    }
  };

  const latest = thread?.messages[thread.messages.length - 1];
  const actions = folderActions(thread?.folder ?? 'inbox');
  const busy = update.isPending || !thread;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-12 shrink-0 items-center gap-0.5 border-b border-border px-2">
        <BarButton icon={ArrowLeft} label="Back to list" onClick={onBack} />
        <span className="mx-1 h-5 w-px bg-border" />
        {actions.canArchive && (
          <BarButton
            icon={Archive}
            label="Archive"
            disabled={busy}
            onClick={() => apply({ folder: 'archive' }, 'Archived', true)}
          />
        )}
        {actions.canRestore && (
          <BarButton
            icon={InboxIcon}
            label="Move to inbox"
            disabled={busy}
            onClick={() => apply({ folder: 'inbox' }, 'Moved to inbox', true)}
          />
        )}
        {actions.canTrash && (
          <BarButton
            icon={Trash2}
            label="Delete"
            disabled={busy}
            onClick={() => apply({ folder: 'trash' }, 'Moved to trash', true)}
          />
        )}
        <BarButton
          icon={Mail}
          label="Mark as unread"
          disabled={busy}
          onClick={() => apply({ isRead: false }, 'Marked as unread', true)}
        />
        {thread && !thread.candidate && (
          <CandidateLinkPicker
            disabled={busy}
            onSelect={(c) =>
              apply({ candidateId: c.id }, 'Linked to candidate')
            }
            trigger={
              <button
                type="button"
                aria-label="Link to candidate"
                title="Link to candidate"
                className={barButton}
              >
                <UserPlus className="h-4 w-4" />
              </button>
            }
          />
        )}
        <div className="ml-auto flex items-center gap-0.5">
          {position !== null && (
            <span className="px-2 text-xs tabular-nums text-muted-foreground">
              {position} of {total}
            </span>
          )}
          <BarButton
            icon={ChevronLeft}
            label="Newer"
            disabled={!onPrev}
            onClick={onPrev}
          />
          <BarButton
            icon={ChevronRight}
            label="Older"
            disabled={!onNext}
            onClick={onNext}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3 p-6">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : isError || !thread ? (
        <EmptyState title="Could not load this conversation" />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex flex-wrap items-center gap-2 px-4 pb-3 pt-5 sm:pl-[68px]">
            <h2 className="text-xl font-normal leading-snug">
              {thread.subject || '(no subject)'}
            </h2>
            {thread.candidate && (
              <span className={cn(linkChipClass, 'h-6 max-w-60')}>
                <User className="h-3 w-3 shrink-0" />
                <button
                  type="button"
                  className="truncate hover:underline"
                  onClick={() => onOpenCandidate(thread.candidate!.id)}
                >
                  {thread.candidate.firstName} {thread.candidate.lastName}
                </button>
                <button
                  type="button"
                  aria-label="Unlink candidate"
                  className="opacity-70 hover:opacity-100"
                  disabled={busy}
                  onClick={() =>
                    apply(
                      { candidateId: null, applicationId: null },
                      'Candidate unlinked',
                    )
                  }
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {thread.client && (
              <span className={cn(linkChipClass, 'h-6 max-w-60')}>
                <Building2 className="h-3 w-3 shrink-0" />
                <Link
                  href={`/dashboard/clients/details?id=${thread.client.id}`}
                  className="truncate hover:underline"
                >
                  {thread.client.name}
                </Link>
                <button
                  type="button"
                  aria-label="Unlink client"
                  className="opacity-70 hover:opacity-100"
                  disabled={busy}
                  onClick={() => apply({ clientId: null }, 'Client unlinked')}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {thread.application?.jobTitle && (
              <span className="inline-flex h-6 max-w-60 items-center gap-1 rounded-full bg-muted px-2 text-[11px] font-medium text-muted-foreground">
                <Briefcase className="h-3 w-3 shrink-0" />
                <span className="truncate">{thread.application.jobTitle}</span>
              </span>
            )}
            {thread.mailbox?.isDemo && (
              <span className="text-xs text-muted-foreground">Demo data</span>
            )}
          </div>

          <div className="border-t border-border">
            {thread.messages.map((m, i) => (
              <MessageItem
                key={m.id}
                message={m}
                ownAddress={thread.mailbox?.emailAddress}
                expanded={
                  i === thread.messages.length - 1 || expanded.has(m.id)
                }
                onToggle={() =>
                  setExpanded((prev) => {
                    const next = new Set(prev);
                    if (next.has(m.id)) next.delete(m.id);
                    else next.add(m.id);
                    return next;
                  })
                }
              />
            ))}
          </div>

          {canSend && latest && (
            <div ref={replyRef} className="px-4 py-4 sm:pl-[68px]">
              {reply ? (
                <div className="overflow-hidden rounded-xl border border-border shadow-sm">
                  <div className="flex items-center gap-2 border-b border-border px-4 py-2 text-xs text-muted-foreground">
                    {reply.all ? (
                      <ReplyAll className="h-3.5 w-3.5" />
                    ) : (
                      <Reply className="h-3.5 w-3.5" />
                    )}
                    {reply.all ? 'Reply all' : 'Reply'}
                  </div>
                  <ComposeForm
                    key={`${reply.message.id}:${reply.all ? 'all' : 'one'}`}
                    mode={{
                      kind: 'reply',
                      thread,
                      message: reply.message,
                      all: reply.all,
                    }}
                    mailboxes={mailboxes}
                    defaultMailboxId={thread.mailboxId}
                    onDone={() => setReply(null)}
                  />
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setReply({ message: latest, all: false })}
                    className="inline-flex h-9 items-center gap-2 rounded-full border border-border px-5 text-sm font-medium hover:bg-accent"
                  >
                    <Reply className="h-4 w-4" />
                    Reply
                  </button>
                  <button
                    type="button"
                    onClick={() => setReply({ message: latest, all: true })}
                    className="inline-flex h-9 items-center gap-2 rounded-full border border-border px-5 text-sm font-medium hover:bg-accent"
                  >
                    <ReplyAll className="h-4 w-4" />
                    Reply all
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
