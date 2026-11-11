'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  FileText,
  PlugZap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  PAGE_INTEGRATION_STATUS,
  SHOW_INTEGRATION_STATUS,
  type IntegrationLevel,
} from '@/config/integration-status';

const LEVEL_META: Record<
  IntegrationLevel,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  integrated: {
    label: 'Integrated',
    icon: CheckCircle2,
    className:
      'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400',
  },
  partial: {
    label: 'Partly integrated',
    icon: CircleDashed,
    className:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400',
  },
  none: {
    label: 'Not integrated',
    icon: PlugZap,
    className:
      'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400',
  },
  static: {
    label: 'Static page',
    icon: FileText,
    className:
      'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400',
  },
};

export function IntegrationStatusPill() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (!SHOW_INTEGRATION_STATUS) return null;

  const path = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;
  const status = PAGE_INTEGRATION_STATUS[path];
  if (!status) return null;

  const meta = LEVEL_META[status.level];
  const Icon = meta.icon;
  const hasDetails = Boolean(status.live?.length || status.preview?.length);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      {open && hasDetails && (
        <div className="pointer-events-auto w-72 rounded-lg border border-border bg-background p-3 text-xs shadow-lg">
          {status.live?.length ? (
            <div className="space-y-1">
              <p className="font-semibold text-green-700 dark:text-green-400">
                Live
              </p>
              <ul className="space-y-0.5 text-muted-foreground">
                {status.live.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {status.preview?.length ? (
            <div className={cn('space-y-1', status.live?.length && 'mt-3')}>
              <p className="font-semibold text-amber-700 dark:text-amber-400">
                Preview only
              </p>
              <ul className="space-y-0.5 text-muted-foreground">
                {status.preview.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={!hasDetails}
        className={cn(
          'pointer-events-auto inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium shadow-md transition-opacity hover:opacity-90 disabled:cursor-default',
          meta.className,
        )}
      >
        <Icon className="h-3.5 w-3.5" />
        {meta.label}
        {hasDetails && (
          <ChevronDown
            className={cn(
              'h-3 w-3 transition-transform',
              !open && 'rotate-180',
            )}
          />
        )}
      </button>
    </div>
  );
}
