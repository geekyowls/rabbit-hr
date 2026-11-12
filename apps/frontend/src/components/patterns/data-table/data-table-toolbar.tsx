'use client';

import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { DataTableToolbarProps } from './data-table-types';
import { Badge } from '@/components/ui/badge';

export function DataTableToolbar<TData>({
  table,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters,
  actions,
  selectedCount = 0,
  selectedActions,
}: DataTableToolbarProps<TData>) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 mt-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {onSearchChange && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                className="pl-9 w-full sm:w-[280px] rounded-xl h-10"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          )}
          {filters}
          {actions}
        </div>
      </div>

      {selectedCount > 0 && selectedActions && (
        <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl">
          <Badge
            variant="secondary"
            className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
          >
            {selectedCount} selected
          </Badge>
          <div className="flex items-center gap-2">{selectedActions}</div>
        </div>
      )}
    </div>
  );
}
