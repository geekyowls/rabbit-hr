'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface KanbanColumnDef<T> {
  id: string;
  title: string;
  color?: string;
  items: T[];
}

export function KanbanBoard<T>({
  columns,
  renderCard,
  getItemKey,
  onCardClick,
  className,
}: {
  columns: KanbanColumnDef<T>[];
  renderCard: (item: T) => React.ReactNode;
  getItemKey: (item: T) => string;
  onCardClick?: (item: T) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex gap-4 overflow-x-auto pb-2', className)}>
      {columns.map((column) => (
        <div
          key={column.id}
          className="flex w-72 shrink-0 flex-col rounded-xl border border-border bg-muted/40"
        >
          <div className="flex items-center justify-between gap-2 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: column.color ?? '#3F6650' }}
              />
              <span className="text-sm font-medium">{column.title}</span>
            </div>
            <span className="rounded-sm bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {column.items.length}
            </span>
          </div>
          <div className="flex flex-col gap-2 px-2 pb-2">
            {column.items.map((item) => (
              <button
                key={getItemKey(item)}
                type="button"
                onClick={onCardClick ? () => onCardClick(item) : undefined}
                className={cn(
                  'rounded-lg border border-border bg-card p-3 text-left shadow-sm transition-colors',
                  onCardClick && 'hover:border-foreground/20 hover:shadow',
                )}
              >
                {renderCard(item)}
              </button>
            ))}
            {column.items.length === 0 && (
              <div className="rounded-lg border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
                No items
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
