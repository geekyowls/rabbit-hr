'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type PillTone =
  'neutral' | 'success' | 'danger' | 'warning' | 'info' | 'purple';

const toneClass: Record<PillTone, string> = {
  neutral: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  success: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  danger: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  purple:
    'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
};

const dotClass: Record<PillTone, string> = {
  neutral: 'bg-zinc-400',
  success: 'bg-green-500',
  danger: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
  purple: 'bg-purple-500',
};

export function StatusPill({
  tone = 'neutral',
  children,
  dot,
  icon,
  className,
}: {
  tone?: PillTone;
  children: React.ReactNode;
  dot?: boolean;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-xs font-medium',
        toneClass[tone],
        className,
      )}
    >
      {dot && (
        <span className={cn('h-1.5 w-1.5 rounded-full', dotClass[tone])} />
      )}
      {icon}
      {children}
    </span>
  );
}
