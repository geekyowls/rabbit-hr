'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Settings2 } from 'lucide-react';
import { DataTableColumnToggleProps } from './data-table-types';

export function DataTableColumnToggle<TData>({
  table,
}: DataTableColumnToggleProps<TData>) {
  const columns = table
    .getAllColumns()
    .filter(
      (column) =>
        typeof column.accessorFn !== 'undefined' && column.getCanHide(),
    );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl">
          Columns <Settings2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 rounded-xl" align="end">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Toggle Columns</h4>
          <div className="space-y-2">
            {columns.map((column) => {
              const title =
                typeof column.columnDef.header === 'string'
                  ? column.columnDef.header
                  : column.id;
              return (
                <div key={column.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  />
                  <label
                    htmlFor={column.id}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {title}
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
