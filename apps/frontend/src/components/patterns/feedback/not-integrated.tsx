'use client';

import { PlugZap } from 'lucide-react';
import { cn } from '@/lib/utils';

export function NotIntegratedBadge({
  className,
  label = 'Not integrated',
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      title="Preview only, not connected to data yet"
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-md border border-dashed border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400',
        className,
      )}
    >
      <PlugZap className="h-3 w-3" />
      {label}
    </span>
  );
}
