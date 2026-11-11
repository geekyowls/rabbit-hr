'use client';

import { useState, type ReactNode } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, StatusPill, type PillTone } from '@/components/patterns';
import { useFormatters } from '@/hooks/use-formatters';
import { useCandidateWhatsappMessagesQuery } from '@/hooks/queries';
import type { WhatsappMessageStatus } from '@/types/whatsapp.type';
import { userLabel } from '@/components/applications/application-meta';

export const MESSAGES_PAGE_SIZE = 10;

const STATUS_LABEL: Record<WhatsappMessageStatus, string> = {
  queued: 'Queued',
  sent: 'Sent',
  failed: 'Failed',
};

const STATUS_TONE: Record<WhatsappMessageStatus, PillTone> = {
  queued: 'info',
  sent: 'success',
  failed: 'danger',
};

export function CandidateMessagesTab({
  candidateId,
  actions,
}: {
  candidateId: string;
  actions?: ReactNode;
}) {
  const fmt = useFormatters();
  const [limit, setLimit] = useState(MESSAGES_PAGE_SIZE);
  const { data, isLoading, isError } = useCandidateWhatsappMessagesQuery(
    candidateId,
    { page: 1, limit },
  );
  const messages = data?.data ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">WhatsApp</p>
        {actions}
      </div>
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-2/3" />
          <Skeleton className="h-16 w-2/3" />
        </div>
      ) : isError ? (
        <EmptyState compact title="Could not load messages" />
      ) : messages.length === 0 ? (
        <EmptyState
          compact
          icon={<MessageCircle className="h-5 w-5" />}
          title="No WhatsApp messages yet"
          description="Template messages sent to this candidate appear here"
        />
      ) : (
        <ul className="space-y-3">
          {messages.map((m) => (
            <li key={m.id} className="flex flex-col items-end gap-1">
              <div className="max-w-[85%] rounded-lg rounded-tr-sm bg-[#DCF8C6] px-3 py-2 text-sm text-zinc-900 dark:bg-[#1F4D33] dark:text-zinc-100">
                <p className="whitespace-pre-wrap break-words">
                  {m.renderedBody || m.templateName}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-1.5 text-xs text-muted-foreground">
                <StatusPill tone={STATUS_TONE[m.status]}>
                  {STATUS_LABEL[m.status]}
                </StatusPill>
                <span>
                  {[
                    m.templateName,
                    userLabel(m.sender) || null,
                    m.application?.job?.title,
                    fmt.dateTime(m.sentAt ?? m.createdAt),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </div>
              {m.status === 'failed' && m.errorMessage && (
                <p className="text-xs text-red-700 dark:text-red-400">
                  {m.errorMessage}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
      {data?.hasNextPage && limit < 100 && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setLimit((l) => Math.min(100, l + MESSAGES_PAGE_SIZE))
            }
          >
            Show more
          </Button>
        </div>
      )}
    </div>
  );
}
