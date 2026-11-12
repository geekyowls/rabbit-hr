import { Table } from '@tanstack/react-table';
import { ReactNode } from 'react';

export interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  totalItems: number;
  pageSizeOptions?: number[];
}

export interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  actions?: ReactNode;
  selectedCount?: number;
  selectedActions?: ReactNode;
}

export interface DataTableColumnToggleProps<TData> {
  table: Table<TData>;
}
