'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Archive,
  Briefcase,
  Building2,
  Inbox as InboxIcon,
  Mail,
  MailOpen,
  Paperclip,
  Reply,
  ReplyAll,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { formatBytes } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { useFormatters } from '@/hooks/use-formatters';
import {
  useInboxThreadQuery,
  useUpdateInboxThreadMutation,
} from '@/hooks/queries';
import { EmptyState, IconButton, ToolbarButton } from '@/components/patterns';
import { InitialsAvatar } from '@/components/ui/initials-avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { errorMessage } from '@/components/applications/application-meta';
import type {
  InboxMessage,
  InboxThreadDetail,
  UpdateInboxThreadRequest,
} from '@/types/inbox.type';
import { CandidateLinkPicker } from './candidate-link-picker';
import { MessageBody } from './message-body';
import { participantLabel, senderLabel } from './inbox-utils';

const chipClass =
  'inline-flex h-7 max-w-full items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 text-xs';

function MessageCard({
  message,
  defaultOpen,
}: {
  message: InboxMessage;
  defaultOpen: boolean;
}) {
  const fmt = useFormatters();
  const [open, setOpen] = useState(defaultOpen);
  const name = senderLabel(message);
  const recipients = message.to.map(participantLabel).join(', ');
  const copies = message.cc.map(participantLabel).join(', ');

  return (
    <article className="rounded-md border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-3 px-3 py-2.5 text-left"
      >
        <InitialsAvatar name={name} className="h-8 w-8 text-xs" />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-medium">{name}</span>
            {message.fromName && (
              <span className="hidden truncate text-xs text-muted-foreground sm:inline">
                {message.fromAddress}
              </span>
            )}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {open ? `To ${recipients}` : message.snippet}
          </span>
          {open && copies && (
            <span className="block truncate text-xs text-muted-foreground">
              Cc {copies}
            </span>
          )}
        </span>
        <span className="shrink-0 text-right text-xs text-muted-foreground">
          {fmt.dateLong(message.sentAt, {
            day: 'numeric',
            month: 'short',
          })}{' '}
          {fmt.time(message.sentAt)}
          {message.deliveryStatus === 'demo' && (
            <span className="block">Demo, not sent</span>
          )}
        </span>
      </button>
      {open && (
        <div className="space-y-3 border-t border-border px-3 py-3">
          <MessageBody html={message.bodyHtml} text={message.bodyText} />
          {message.attachments.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {message.attachments.map((a, i) => (
                <li key={`${a.filename}-${i}`} className={chipClass}>
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
      )}
    </article>
  );
}

export function ThreadView({
  threadId,
  canSend,
  onReply,
  onOpenCandidate,
  onClose,
}: {
  threadId: string | null;
  canSend: boolean;
  onReply: (
    thread: InboxThreadDetail,
    message: InboxMessage,
    all: boolean,
  ) => void;
  onOpenCandidate: (candidateId: string) => void;
  onClose?: () => void;
}) {
  const { data: thread, isLoading, isError } = useInboxThreadQuery(threadId);
  const update = useUpdateInboxThreadMutation();

  if (!threadId) {
    return (
      <EmptyState
        icon={<Mail className="h-8 w-8" />}
        title="Select a conversation"
        description="Pick a thread from the list to read it here"
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !thread) {
    return <EmptyState title="Could not load this conversation" />;
  }

  const apply = async (data: UpdateInboxThreadRequest, success: string) => {
    try {
      await update.mutateAsync({ id: thread.id, data });
      toast.success(success);
    } catch (err) {
      toast.error('Could not update conversation', errorMessage(err));
    }
  };

  const latest = thread.messages[thread.messages.length - 1];
  const inMovedFolder =
    thread.folder === 'archive' || thread.folder === 'trash';
  const readOnlyDemo = !!thread.mailbox?.isDemo;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border px-4 py-2">
        {canSend && latest && (
          <>
            <ToolbarButton
              icon={Reply}
              onClick={() => onReply(thread, latest, false)}
            >
              Reply
            </ToolbarButton>
            <ToolbarButton
              icon={ReplyAll}
              onClick={() => onReply(thread, latest, true)}
            >
              Reply all
            </ToolbarButton>
          </>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          <IconButton
            icon={thread.isUnread ? MailOpen : Mail}
            label={thread.isUnread ? 'Mark as read' : 'Mark as unread'}
            disabled={update.isPending}
            onClick={() =>
              apply(
                { isRead: thread.isUnread },
                thread.isUnread ? 'Marked as read' : 'Marked as unread',
              )
            }
          />
          {inMovedFolder ? (
            <IconButton
              icon={InboxIcon}
              label="Move to inbox"
              disabled={update.isPending}
              onClick={() => apply({ folder: 'inbox' }, 'Moved to inbox')}
            />
          ) : (
            <IconButton
              icon={Archive}
              label="Archive"
              disabled={update.isPending}
              onClick={() => apply({ folder: 'archive' }, 'Archived')}
            />
          )}
          {thread.folder !== 'trash' && (
            <IconButton
              icon={Trash2}
              label="Move to trash"
              disabled={update.isPending}
              onClick={() => apply({ folder: 'trash' }, 'Moved to trash')}
            />
          )}
          {onClose && <IconButton icon={X} label="Close" onClick={onClose} />}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        <div className="space-y-2">
          <h2 className="text-base font-semibold leading-snug">
            {thread.subject || '(no subject)'}
          </h2>
          <div className="flex flex-wrap items-center gap-1.5">
            {thread.candidate ? (
              <span className={chipClass}>
                <User className="h-3 w-3 shrink-0 text-[#3F6650] dark:text-[#8FBFA1]" />
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
                  className="text-muted-foreground hover:text-foreground"
                  disabled={update.isPending}
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
            ) : (
              <CandidateLinkPicker
                disabled={update.isPending}
                onSelect={(c) =>
                  apply({ candidateId: c.id }, 'Linked to candidate')
                }
              />
            )}
            {thread.client && (
              <span className={chipClass}>
                <Building2 className="h-3 w-3 shrink-0 text-[#3F6650] dark:text-[#8FBFA1]" />
                <Link
                  href={`/dashboard/clients/details?id=${thread.client.id}`}
                  className="truncate hover:underline"
                >
                  {thread.client.name}
                </Link>
                <button
                  type="button"
                  aria-label="Unlink client"
                  className="text-muted-foreground hover:text-foreground"
                  disabled={update.isPending}
                  onClick={() => apply({ clientId: null }, 'Client unlinked')}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {thread.application?.jobTitle && (
              <span className={chipClass}>
                <Briefcase className="h-3 w-3 shrink-0 text-muted-foreground" />
                <span className="truncate">{thread.application.jobTitle}</span>
              </span>
            )}
            {readOnlyDemo && (
              <span className="text-xs text-muted-foreground">Demo data</span>
            )}
          </div>
        </div>
        {thread.messages.map((m, i) => (
          <MessageCard
            key={m.id}
            message={m}
            defaultOpen={i === thread.messages.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
