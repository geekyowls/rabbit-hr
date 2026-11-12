'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

export type StatTone = 'default' | 'positive' | 'negative' | 'warning' | 'info';

const toneClass: Record<StatTone, string> = {
  default: 'text-foreground',
  positive: 'text-green-600 dark:text-green-400',
  negative: 'text-red-600 dark:text-red-400',
  warning: 'text-amber-600 dark:text-amber-400',
  info: 'text-blue-600 dark:text-blue-400',
};

export function StatTile({
  label,
  value,
  unit,
  tone = 'default',
  icon,
  className,
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  tone?: StatTone;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        {icon}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className={cn('text-2xl font-semibold', toneClass[tone])}>
          {value}
        </span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
    </Card>
  );
}

export function StatTileRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4',
        className,
      )}
    >
      {children}
    </div>
  );
}
