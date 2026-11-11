'use client';

import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import {
  ChevronDown,
  ChevronRight,
  Info,
  Mail,
  Paperclip,
  Send,
} from 'lucide-react';
import { zodResolver } from '@/lib/zod-resolver';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/patterns';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';
import { useFormatters } from '@/hooks/use-formatters';
import {
  useInboxThreadQuery,
  useInboxThreadsQuery,
  useSendInboxMessageMutation,
} from '@/hooks/queries';
import type {
  EmailParticipant,
  InboxMessage,
  InboxThread,
} from '@/types/inbox.type';
import { errorMessage } from '@/components/applications/application-meta';
import { textToHtml } from './email-html';

const PAGE_SIZE = 20;
const MAX_LIMIT = 100;

const replySchema = z.object({
  body: z.string().trim().min(1, 'Write a reply first').max(20000),
});

type ReplyFormData = z.infer<typeof replySchema>;

export interface EmailLinkTarget {
  candidateId?: string;
  clientId?: string;
}

function participantLabel(p: EmailParticipant) {
  return p.name || p.email;
}

function DemoNote() {
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <Info className="h-3.5 w-3.5 shrink-0" />
      Demo inbox, emails are not really sent
    </span>
  );
}

function MessageBody({ message }: { message: InboxMessage }) {
  if (message.bodyHtml) {
    return (
      <div
        className="break-words text-sm text-foreground/90 [&_a]:text-[#3F6650] [&_a]:underline dark:[&_a]:text-[#8FBFA1] [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5"
        dangerouslySetInnerHTML={{ __html: message.bodyHtml }}
      />
    );
  }
  return (
    <p className="whitespace-pre-wrap break-words text-sm text-foreground/90">
      {message.bodyText || message.snippet}
    </p>
  );
}

function ReplyBox({
  thread,
  target,
}: {
  thread: InboxThread;
  target: EmailLinkTarget;
}) {
  const send = useSendInboxMessageMutation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReplyFormData>({
    resolver: zodResolver(replySchema),
    defaultValues: { body: '' },
  });

  const submit = handleSubmit(async ({ body }) => {
    try {
      const result = await send.mutateAsync({
        threadId: thread.id,
        html: textToHtml(body),
        ...target,
      });
      if (result.deliveryStatus === 'demo') {
        toast.info('Reply saved', 'Demo inbox, not sent');
      } else {
        toast.success('Reply sent');
      }
      reset({ body: '' });
    } catch (err) {
      toast.error('Could not send reply', errorMessage(err));
    }
  });

  return (
    <form onSubmit={submit} className="space-y-2 border-t border-border pt-3">
      <Textarea
        rows={3}
        placeholder="Write a reply"
        aria-label="Reply"
        {...register('body')}
      />
      {errors.body && (
        <p className="text-xs text-destructive">{errors.body.message}</p>
      )}
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isSubmitting}>
          <Send className="mr-1.5 h-3.5 w-3.5" />
          {isSubmitting ? 'Sending...' : 'Send reply'}
        </Button>
      </div>
    </form>
  );
}

function ThreadMessages({
  thread,
  target,
}: {
  thread: InboxThread;
  target: EmailLinkTarget;
}) {
  const fmt = useFormatters();
  const { data, isLoading, isError } = useInboxThreadQuery(thread.id);

  if (isLoading) return <Skeleton className="h-24 w-full" />;
  if (isError || !data) {
    return (
      <p className="text-sm text-muted-foreground">
        Could not load this conversation
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {data.messages.map((m) => (
        <div
          key={m.id}
          className={cn(
            'rounded-md border border-border px-3 py-2.5',
            m.isOutbound && 'bg-muted/40',
          )}
        >
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0 text-xs">
              <span className="font-medium text-foreground">
                {m.fromName || m.fromAddress}
              </span>
              {m.to.length > 0 && (
                <span className="text-muted-foreground">
                  {' to '}
                  {m.to.map(participantLabel).join(', ')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {m.deliveryStatus === 'demo' && (
                <span className="text-xs text-muted-foreground">
                  Demo, not sent
                </span>
              )}
              {m.hasAttachments && (
                <Paperclip
                  className="h-3.5 w-3.5 text-muted-foreground"
                  aria-label="Has attachments"
                />
              )}
              <span className="text-xs text-muted-foreground">
                {fmt.dateTime(m.sentAt)}
              </span>
            </div>
          </div>
          <MessageBody message={m} />
          {m.attachments.length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              {m.attachments.map((a) => a.filename).join(', ')}
            </p>
          )}
        </div>
      ))}
      <PermissionGuard permissions={PERMISSIONS_ENUM.INBOX_SEND}>
        <ReplyBox thread={thread} target={target} />
      </PermissionGuard>
    </div>
  );
}

function ThreadRow({
  thread,
  target,
  expanded,
  onToggle,
}: {
  thread: InboxThread;
  target: EmailLinkTarget;
  expanded: boolean;
  onToggle: () => void;
}) {
  const fmt = useFormatters();
  const Chevron = expanded ? ChevronDown : ChevronRight;
  return (
    <li className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-accent/50"
      >
        <Chevron className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p
              className={cn(
                'truncate text-sm',
                thread.isUnread ? 'font-semibold' : 'font-medium',
              )}
            >
              {thread.subject || 'No subject'}
            </p>
            {thread.messageCount > 1 && (
              <span className="shrink-0 text-xs text-muted-foreground">
                {thread.messageCount}
              </span>
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {thread.participants.map(participantLabel).join(', ')}
          </p>
          {!expanded && (
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
              {thread.snippet}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-xs text-muted-foreground">
            {fmt.relative(thread.lastMessageAt)}
          </span>
          {thread.application?.jobTitle && (
            <span className="max-w-[160px] truncate text-xs text-muted-foreground">
              {thread.application.jobTitle}
            </span>
          )}
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 pl-11">
          <ThreadMessages thread={thread} target={target} />
        </div>
      )}
    </li>
  );
}

export function LinkedEmailThreads({
  target,
  emptyTitle,
  emptyDescription,
  actions,
  className,
}: {
  target: EmailLinkTarget;
  emptyTitle: string;
  emptyDescription?: string;
  actions?: ReactNode;
  className?: string;
}) {
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data, isLoading, isError } = useInboxThreadsQuery({
    page: 1,
    limit,
    ...target,
  });
  const threads = data?.data ?? [];
  const hasDemo = threads.some((t) => t.mailbox?.isDemo);

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <p className="text-sm font-medium">
            {data
              ? data.total === 1
                ? '1 conversation'
                : `${data.total} conversations`
              : 'Conversations'}
          </p>
          {hasDemo && <DemoNote />}
        </div>
        {actions}
      </div>
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : isError ? (
        <EmptyState compact title="Could not load emails" />
      ) : threads.length === 0 ? (
        <EmptyState
          compact
          icon={<Mail className="h-5 w-5" />}
          title={emptyTitle}
          description={emptyDescription}
        />
      ) : (
        <ul className="overflow-hidden rounded-md border border-border">
          {threads.map((t) => (
            <ThreadRow
              key={t.id}
              thread={t}
              target={target}
              expanded={expandedId === t.id}
              onToggle={() =>
                setExpandedId((id) => (id === t.id ? null : t.id))
              }
            />
          ))}
        </ul>
      )}
      {data?.hasNextPage && limit < MAX_LIMIT && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLimit((l) => Math.min(MAX_LIMIT, l + PAGE_SIZE))}
          >
            Show more
          </Button>
        </div>
      )}
    </div>
  );
}
