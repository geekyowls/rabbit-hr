'use client';

import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

function formatValue(value: number, format: 'percent' | 'number'): string {
  const abs = Math.abs(value);
  if (format === 'percent') return `${abs.toFixed(1)}%`;
  return abs.toLocaleString();
}

export function DeltaBadge({
  value,
  format = 'percent',
  invertColors,
  className,
}: {
  value: number;
  format?: 'percent' | 'number';
  invertColors?: boolean;
  className?: string;
}) {
  const direction = value > 0.05 ? 'up' : value < -0.05 ? 'down' : 'flat';
  const Icon =
    direction === 'up'
      ? ArrowUpRight
      : direction === 'down'
        ? ArrowDownRight
        : Minus;

  const positive = invertColors ? direction === 'down' : direction === 'up';
  const negative = invertColors ? direction === 'up' : direction === 'down';

  const tone = positive
    ? 'text-emerald-700 dark:text-emerald-400'
    : negative
      ? 'text-rose-700 dark:text-rose-400'
      : 'text-muted-foreground';

  const sign = value > 0 ? '+' : value < 0 ? '−' : '';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-medium tabular-nums',
        tone,
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {sign}
      {formatValue(value, format)}
    </span>
  );
}
