'use client';

import { useState, useCallback, useRef, type KeyboardEvent } from 'react';
import { flexRender, Table as TanStackTable } from '@tanstack/react-table';
import { Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface DataTableProps<TData> {
  table: TanStackTable<TData>;
  isLoading?: boolean;
  onRowClick?: (row: TData) => void;
  getRowClassName?: (row: TData) => string;
  emptyMessage?: string;
  enableRowSelection?: boolean;
  enableKeyboardNavigation?: boolean;
}

export function DataTable<TData>({
  table,
  isLoading,
  onRowClick,
  getRowClassName,
  emptyMessage = 'No results found.',
  enableRowSelection = false,
  enableKeyboardNavigation = true,
}: DataTableProps<TData>) {
  const columns = table.getAllColumns();
  const rows = table.getRowModel().rows;
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(-1);
  const tableRef = useRef<HTMLTableElement>(null);

  const scrollToRow = useCallback((index: number) => {
    requestAnimationFrame(() => {
      if (!tableRef.current) return;
      const row = tableRef.current.querySelector<HTMLElement>(
        `[data-row-index="${index}"]`,
      );
      if (row) {
        row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTableElement>) => {
      if (!enableKeyboardNavigation || rows.length === 0) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setFocusedRowIndex((prev) => {
            const next = prev < 0 ? 0 : Math.min(prev + 1, rows.length - 1);
            scrollToRow(next);
            return next;
          });
          break;

        case 'ArrowUp':
          event.preventDefault();
          setFocusedRowIndex((prev) => {
            const next = prev <= 0 ? 0 : prev - 1;
            scrollToRow(next);
            return next;
          });
          break;

        case 'Enter':
          if (focusedRowIndex >= 0 && focusedRowIndex < rows.length) {
            event.preventDefault();
            const row = rows[focusedRowIndex];
            if (row && onRowClick) {
              onRowClick(row.original);
            }
          }
          break;

        case 'Home':
          event.preventDefault();
          setFocusedRowIndex(0);
          scrollToRow(0);
          break;

        case 'End':
          event.preventDefault();
          const lastIndex = rows.length - 1;
          setFocusedRowIndex(lastIndex);
          scrollToRow(lastIndex);
          break;

        case ' ':
          if (
            enableRowSelection &&
            focusedRowIndex >= 0 &&
            focusedRowIndex < rows.length
          ) {
            event.preventDefault();
            const row = rows[focusedRowIndex];
            if (row) {
              row.toggleSelected(!row.getIsSelected());
            }
          }
          break;

        case 'PageDown':
        case ']':
          if (table.getCanNextPage()) {
            event.preventDefault();
            table.nextPage();
            setFocusedRowIndex(0);
          }
          break;

        case 'PageUp':
        case '[':
          if (table.getCanPreviousPage()) {
            event.preventDefault();
            table.previousPage();
            setFocusedRowIndex(0);
          }
          break;
      }
    },
    [
      enableKeyboardNavigation,
      rows,
      focusedRowIndex,
      onRowClick,
      enableRowSelection,
      table,
      scrollToRow,
    ],
  );

  return (
    <Table
      ref={tableRef}
      tabIndex={enableKeyboardNavigation ? 0 : undefined}
      onKeyDown={enableKeyboardNavigation ? handleKeyDown : undefined}
      className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      role="grid"
      aria-activedescendant={
        focusedRowIndex >= 0 ? `row-${focusedRowIndex}` : undefined
      }
    >
      <TableHeader>
        <TableRow>
          {enableRowSelection && (
            <TableHead className="w-[64px]">
              <Checkbox
                checked={table.getIsAllPageRowsSelected()}
                onCheckedChange={(value) =>
                  table.toggleAllPageRowsSelected(!!value)
                }
                className="ml-2"
              />
            </TableHead>
          )}
          {table.getHeaderGroups().map((headerGroup) =>
            headerGroup.headers.map((header) => (
              <TableHead
                key={header.id}
                style={{ width: header.column.columnDef.size }}
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
              </TableHead>
            )),
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell
              colSpan={columns.length + (enableRowSelection ? 1 : 0)}
              className="h-24 text-center"
            >
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Loading...
                </span>
              </div>
            </TableCell>
          </TableRow>
        ) : rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={columns.length + (enableRowSelection ? 1 : 0)}
              className="h-24 text-center text-muted-foreground"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row, rowIndex) => (
            <TableRow
              key={row.id}
              id={`row-${rowIndex}`}
              data-row-index={rowIndex}
              data-state={row.getIsSelected() && 'selected'}
              onClick={() => {
                setFocusedRowIndex(rowIndex);
                onRowClick?.(row.original);
              }}
              className={cn(
                getRowClassName?.(row.original),
                enableKeyboardNavigation &&
                  focusedRowIndex === rowIndex &&
                  'ring-2 ring-primary ring-inset',
              )}
              aria-selected={focusedRowIndex === rowIndex}
              role="row"
            >
              {enableRowSelection && (
                <TableCell
                  className="w-[64px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    className="ml-2"
                  />
                </TableCell>
              )}
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className={
                    (cell.column.columnDef.meta as { cellClassName?: string })
                      ?.cellClassName
                  }
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
