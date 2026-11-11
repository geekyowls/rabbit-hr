'use client';

import { Columns3, Pin } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ColumnChooser({
  columns,
  hidden,
  onHiddenChange,
  pinned,
  onPinnedChange,
}: {
  columns: { key: string; header: string }[];
  hidden: string[];
  onHiddenChange: (keys: string[]) => void;
  pinned?: string[];
  onPinnedChange?: (keys: string[]) => void;
}) {
  const hiddenSet = new Set(hidden);
  const pinnedSet = new Set(pinned ?? []);
  const visibleCount = columns.length - hiddenSet.size;

  const toggleHidden = (key: string) => {
    const next = new Set(hiddenSet);
    if (next.has(key)) next.delete(key);
    else if (visibleCount > 1) next.add(key);
    onHiddenChange([...next]);
  };
  const togglePin = (key: string) => {
    if (!onPinnedChange) return;
    const next = new Set(pinnedSet);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onPinnedChange([...next]);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex h-8 items-center gap-1.5 rounded-md border border-input bg-background px-2.5 text-[13px] font-medium outline-none hover:bg-accent">
        <Columns3 className="h-3.5 w-3.5 text-muted-foreground" />
        Columns
        {hiddenSet.size > 0 && (
          <span className="text-muted-foreground">
            {visibleCount}/{columns.length}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[13rem]">
        <DropdownMenuLabel>Show columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-72 overflow-y-auto py-1">
          {columns.map((col) => {
            const visible = !hiddenSet.has(col.key);
            const isPinned = pinnedSet.has(col.key);
            return (
              <div
                key={col.key}
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
              >
                <input
                  type="checkbox"
                  checked={visible}
                  onChange={() => toggleHidden(col.key)}
                  className="h-3.5 w-3.5 accent-[#3F6650]"
                />
                <button
                  type="button"
                  onClick={() => toggleHidden(col.key)}
                  className="flex-1 truncate text-left"
                >
                  {col.header}
                </button>
                {onPinnedChange && (
                  <button
                    type="button"
                    onClick={() => togglePin(col.key)}
                    aria-label={isPinned ? 'Unpin' : 'Pin'}
                    className={cn(
                      'rounded-sm p-1 hover:bg-muted',
                      isPinned ? 'text-[#3F6650]' : 'text-muted-foreground/40',
                    )}
                  >
                    <Pin className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
