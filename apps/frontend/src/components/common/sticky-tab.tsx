'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type StickyTabColor =
  | 'amber'
  | 'emerald'
  | 'yellow'
  | 'blue'
  | 'rose'
  | 'violet';

const COLOR_MAP: Record<StickyTabColor, string> = {
  amber:
    'border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-700 dark:bg-amber-950/70 dark:text-amber-100',
  emerald:
    'border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-100',
  yellow:
    'border-yellow-300 bg-yellow-100 text-yellow-900 dark:border-yellow-700 dark:bg-yellow-950/70 dark:text-yellow-100',
  blue: 'border-blue-300 bg-blue-100 text-blue-900 dark:border-blue-700 dark:bg-blue-950/70 dark:text-blue-100',
  rose: 'border-rose-300 bg-rose-100 text-rose-900 dark:border-rose-700 dark:bg-rose-950/70 dark:text-rose-100',
  violet:
    'border-violet-300 bg-violet-100 text-violet-900 dark:border-violet-700 dark:bg-violet-950/70 dark:text-violet-100',
};

export function StickyTabRail({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'fixed right-6 bottom-6 z-40 flex flex-col gap-2',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function StickyTab({
  label,
  icon,
  color = 'amber',
  active = false,
  highlight = false,
  onClick,
  title,
}: {
  label: string;
  icon?: ReactNode;
  color?: StickyTabColor;
  active?: boolean;
  highlight?: boolean;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'relative flex flex-col items-center gap-1.5 rounded-l-lg border-2 border-r-0 py-3 pl-2.5 pr-2 shadow-md transition-all hover:pr-3.5 hover:shadow-lg',
        COLOR_MAP[color],
        active && 'pr-3.5 shadow-lg',
      )}
    >
      {highlight && (
        <span className="absolute -left-1 -top-1 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-rose-500 ring-2 ring-white dark:ring-zinc-950" />
        </span>
      )}
      {icon}
      <span
        className="text-xs font-semibold tracking-wide"
        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
      >
        {label}
      </span>
    </button>
  );
}
