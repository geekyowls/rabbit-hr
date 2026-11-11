'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { IconButton } from '@/components/patterns';

export function ListFooter({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
}: {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  return (
    <div className="flex items-center justify-between border border-t-0 border-border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">
      <span>
        Showing {from}-{to} of {total}
      </span>
      <div className="flex items-center gap-2">
        <span>
          Page {page} of {Math.max(1, totalPages)}
        </span>
        <IconButton
          icon={ChevronLeft}
          label="Previous page"
          className="h-6 w-6"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        />
        <IconButton
          icon={ChevronRight}
          label="Next page"
          className="h-6 w-6"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        />
      </div>
    </div>
  );
}
