'use client';

import { useState } from 'react';
import { Maximize2, Minus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Mailbox } from '@/types/mailbox.type';
import { ComposeForm } from './compose-form';

export function ComposeWindow({
  onClose,
  mailboxes,
  defaultMailboxId,
}: {
  onClose: () => void;
  mailboxes: Mailbox[];
  defaultMailboxId: string | null;
}) {
  const [minimized, setMinimized] = useState(false);

  return (
    <div
      role="dialog"
      aria-label="New message"
      className={cn(
        'fixed inset-x-0 bottom-0 z-50 flex flex-col overflow-hidden border border-border bg-card shadow-2xl md:inset-x-auto md:right-6 md:w-[520px] md:rounded-t-xl',
        minimized
          ? 'h-auto md:w-72'
          : 'h-[92vh] md:h-[min(600px,calc(100vh-6rem))]',
      )}
    >
      <div
        className="flex h-10 shrink-0 cursor-pointer items-center gap-1 bg-muted px-4"
        onClick={() => setMinimized((m) => !m)}
      >
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          New message
        </span>
        <button
          type="button"
          aria-label={minimized ? 'Expand' : 'Minimise'}
          title={minimized ? 'Expand' : 'Minimise'}
          className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation();
            setMinimized((m) => !m);
          }}
        >
          {minimized ? (
            <Maximize2 className="h-3.5 w-3.5" />
          ) : (
            <Minus className="h-4 w-4" />
          )}
        </button>
        <button
          type="button"
          aria-label="Close"
          title="Close"
          className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <ComposeForm
        mode={{ kind: 'new' }}
        mailboxes={mailboxes}
        defaultMailboxId={defaultMailboxId}
        onDone={onClose}
        className={cn('flex-1', minimized && 'hidden')}
      />
    </div>
  );
}
