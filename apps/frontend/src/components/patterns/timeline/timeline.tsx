'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TimelineEntry {
  id: string;
  icon?: React.ReactNode;
  title: React.ReactNode;
  meta?: string;
  time?: string;
  body?: React.ReactNode;
  color?: string;
}

export function Timeline({
  entries,
  className,
}: {
  entries: TimelineEntry[];
  className?: string;
}) {
  return (
    <ol className={cn('relative space-y-5', className)}>
      {entries.map((entry, i) => (
        <li key={entry.id} className="relative flex gap-3">
          <div className="flex flex-col items-center">
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground"
              style={
                entry.color
                  ? { borderColor: entry.color, color: entry.color }
                  : undefined
              }
            >
              {entry.icon ?? (
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: entry.color ?? 'currentColor' }}
                />
              )}
            </span>
            {i < entries.length - 1 && (
              <span className="mt-1 w-px flex-1 bg-border" />
            )}
          </div>
          <div className="flex-1 pb-1">
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
              <span className="text-sm font-medium">{entry.title}</span>
              {entry.time && (
                <span className="text-xs text-muted-foreground">
                  {entry.time}
                </span>
              )}
            </div>
            {entry.meta && (
              <p className="text-xs text-muted-foreground">{entry.meta}</p>
            )}
            {entry.body && (
              <div className="mt-1 text-sm text-muted-foreground">
                {entry.body}
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
