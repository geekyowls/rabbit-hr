'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SegmentOption<V extends string> {
  value: V;
  label?: string;
  icon?: React.ReactNode;
}

export function SegmentedControl<V extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: V;
  options: SegmentOption<V>[];
  onChange: (value: V) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'inline-flex h-9 items-center gap-0.5 rounded-lg border border-input bg-muted p-0.5',
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors',
              active
                ? 'bg-background text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
