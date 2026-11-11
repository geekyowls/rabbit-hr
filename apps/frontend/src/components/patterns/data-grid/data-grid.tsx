'use client';

import * as React from 'react';
import {
  ChevronDown,
  Pin,
  PinOff,
  ArrowLeft,
  ArrowRight,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface DataGridColumn<T> {
  key: string;
  header: string;
  width?: number;
  align?: 'left' | 'right' | 'center';
  render?: (row: T) => React.ReactNode;
  accessor?: (row: T) => React.ReactNode;
  mono?: boolean;
}

const CHECKBOX_W = 40;
const DEFAULT_W = 150;

export function DataGrid<T>({
  columns,
  rows,
  getRowId,
  selectable,
  selectedIds,
  onSelectionChange,
  onRowClick,
  pinFirstColumn,
  maxHeight = 480,
  onLoadMore,
  hasMore,
  loadingMore,
  pinnedColumns,
  onPinnedChange,
  hiddenColumns,
  onHiddenColumnsChange,
  className,
}: {
  columns: DataGridColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onRowClick?: (row: T) => void;
  pinFirstColumn?: boolean;
  maxHeight?: number | string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  pinnedColumns?: string[];
  onPinnedChange?: (keys: string[]) => void;
  hiddenColumns?: string[];
  onHiddenColumnsChange?: (keys: string[]) => void;
  className?: string;
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const sentinelRef = React.useRef<HTMLDivElement>(null);
  const dragKey = React.useRef<string | null>(null);

  const [order, setOrder] = React.useState<string[]>(columns.map((c) => c.key));
  const [pinnedInternal, setPinnedInternal] = React.useState<Set<string>>(
    new Set(pinFirstColumn && columns[0] ? [columns[0].key] : []),
  );
  const [hiddenInternal, setHiddenInternal] = React.useState<Set<string>>(
    new Set(),
  );

  const pinned = pinnedColumns ? new Set(pinnedColumns) : pinnedInternal;
  const hidden = hiddenColumns ? new Set(hiddenColumns) : hiddenInternal;
  const emitPinned = (next: Set<string>) =>
    onPinnedChange ? onPinnedChange([...next]) : setPinnedInternal(next);
  const emitHidden = (next: Set<string>) =>
    onHiddenColumnsChange
      ? onHiddenColumnsChange([...next])
      : setHiddenInternal(next);

  const colMap = React.useMemo(
    () => new Map(columns.map((c) => [c.key, c])),
    [columns],
  );

  React.useEffect(() => {
    const sentinel = sentinelRef.current;
    const root = scrollRef.current;
    if (!sentinel || !onLoadMore || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) onLoadMore();
      },
      { root, rootMargin: '160px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [onLoadMore, hasMore, loadingMore, rows.length]);

  const visible = order.filter((k) => !hidden.has(k) && colMap.has(k));
  const orderedKeys = [
    ...visible.filter((k) => pinned.has(k)),
    ...visible.filter((k) => !pinned.has(k)),
  ];

  const leftOffset: Record<string, number> = {};
  let acc = selectable ? CHECKBOX_W : 0;
  for (const k of orderedKeys) {
    if (!pinned.has(k)) break;
    leftOffset[k] = acc;
    acc += colMap.get(k)?.width ?? DEFAULT_W;
  }

  const selected = new Set(selectedIds ?? []);
  const allChecked =
    rows.length > 0 && rows.every((r) => selected.has(getRowId(r)));
  const toggleAll = () =>
    onSelectionChange?.(allChecked ? [] : rows.map(getRowId));
  const toggleOne = (id: string) => {
    if (!onSelectionChange) return;
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange([...next]);
  };

  const alignClass = (a?: 'left' | 'right' | 'center') =>
    a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left';

  const reorder = (from: string, to: string) => {
    if (from === to) return;
    setOrder((prev) => {
      const next = prev.filter((k) => k !== from);
      const idx = next.indexOf(to);
      next.splice(idx, 0, from);
      return next;
    });
  };
  const nudge = (key: string, dir: -1 | 1) =>
    setOrder((prev) => {
      const i = prev.indexOf(key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const togglePin = (key: string) => {
    const next = new Set(pinned);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    emitPinned(next);
  };

  const headBase =
    'sticky top-0 z-20 border-b border-r border-border bg-[#EDF1EE] px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-[#3A443C] dark:bg-[#16201A] dark:text-[#8FBFA1]';
  const cellBase =
    'border-b border-r border-border px-3 py-2.5 text-sm text-foreground';
  const pinnedShadow = 'shadow-[1px_0_0_0_var(--border)]';

  return (
    <div
      ref={scrollRef}
      className={cn(
        'overflow-auto border border-border bg-background',
        className,
      )}
      style={{ maxHeight }}
    >
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {selectable && (
              <th
                className={cn(
                  headBase,
                  'sticky left-0 z-30 px-0 text-center',
                  pinnedShadow,
                )}
                style={{ width: CHECKBOX_W, minWidth: CHECKBOX_W }}
              >
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  className="h-3.5 w-3.5 accent-[#3F6650]"
                />
              </th>
            )}
            {orderedKeys.map((key) => {
              const col = colMap.get(key)!;
              const isPinned = pinned.has(key);
              return (
                <th
                  key={key}
                  draggable
                  onDragStart={() => (dragKey.current = key)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragKey.current) reorder(dragKey.current, key);
                    dragKey.current = null;
                  }}
                  className={cn(
                    headBase,
                    alignClass(col.align),
                    'group cursor-grab select-none last:border-r-0',
                    isPinned && cn('z-30', pinnedShadow),
                  )}
                  style={{
                    width: col.width,
                    minWidth: col.width,
                    left: isPinned ? leftOffset[key] : undefined,
                    position: isPinned ? 'sticky' : undefined,
                  }}
                >
                  <span className="flex items-center gap-1">
                    <span className="truncate">{col.header}</span>
                    {isPinned && (
                      <Pin className="h-3 w-3 shrink-0 text-[#3F6650]" />
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger className="ml-auto opacity-0 outline-none group-hover:opacity-100 data-[state=open]:opacity-100">
                        <ChevronDown className="h-3.5 w-3.5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        className="min-w-[9rem]"
                      >
                        <DropdownMenuItem
                          onSelect={() => togglePin(key)}
                          className="gap-2"
                        >
                          {isPinned ? (
                            <PinOff className="h-4 w-4" />
                          ) : (
                            <Pin className="h-4 w-4" />
                          )}
                          {isPinned ? 'Unpin' : 'Pin to left'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => nudge(key, -1)}
                          className="gap-2"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          Move left
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => nudge(key, 1)}
                          className="gap-2"
                        >
                          <ArrowRight className="h-4 w-4" />
                          Move right
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={() => emitHidden(new Set(hidden).add(key))}
                          className="gap-2"
                        >
                          <EyeOff className="h-4 w-4" />
                          Hide column
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const id = getRowId(row);
            const isSelected = selected.has(id);
            return (
              <tr
                key={id}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  onRowClick && 'cursor-pointer',
                  isSelected
                    ? 'bg-[#EDF1EE]/70 dark:bg-[#3F6650]/20'
                    : 'hover:bg-[#EDF1EE]/40 dark:hover:bg-[#3F6650]/10',
                )}
              >
                {selectable && (
                  <td
                    className={cn(
                      cellBase,
                      'sticky left-0 z-10 bg-inherit px-0 text-center',
                      pinnedShadow,
                    )}
                    style={{ width: CHECKBOX_W, minWidth: CHECKBOX_W }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOne(id)}
                      className="h-3.5 w-3.5 accent-[#3F6650]"
                    />
                  </td>
                )}
                {orderedKeys.map((key) => {
                  const col = colMap.get(key)!;
                  const isPinned = pinned.has(key);
                  const content = col.render
                    ? col.render(row)
                    : col.accessor
                      ? col.accessor(row)
                      : String((row as Record<string, unknown>)[key] ?? '');
                  return (
                    <td
                      key={key}
                      className={cn(
                        cellBase,
                        alignClass(col.align),
                        col.mono && 'tabular-nums',
                        'last:border-r-0',
                        isPinned && cn('z-10 bg-inherit', pinnedShadow),
                      )}
                      style={{
                        width: col.width,
                        minWidth: col.width,
                        left: isPinned ? leftOffset[key] : undefined,
                        position: isPinned ? 'sticky' : undefined,
                      }}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      {(hasMore || loadingMore) && (
        <div
          ref={sentinelRef}
          className="flex items-center justify-center border-t border-border py-3 text-xs text-muted-foreground"
        >
          {loadingMore ? 'Loading more...' : ''}
        </div>
      )}
    </div>
  );
}
