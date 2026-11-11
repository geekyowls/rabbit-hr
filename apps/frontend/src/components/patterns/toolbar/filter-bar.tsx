'use client';

import * as React from 'react';
import { Check, ChevronDown, RefreshCw, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function FilterBar({
  children,
  end,
  className,
}: {
  children?: React.ReactNode;
  end?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-1.5',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
      {end && <div className="flex flex-wrap items-center gap-1.5">{end}</div>}
    </div>
  );
}

const controlBase =
  'inline-flex h-8 items-center gap-1.5 rounded-md border border-input bg-background px-2.5 text-[13px] transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

export interface FilterOption {
  label: string;
  value: string;
}

export function FilterDropdown({
  label,
  icon: Icon,
  value,
  options,
  onChange,
  className,
}: {
  label?: string;
  icon?: LucideIcon;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  className?: string;
}) {
  const selected = options.find((o) => o.value === value);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(controlBase, className)}>
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        {label && (
          <span className="font-normal text-muted-foreground">{label}</span>
        )}
        <span className="font-medium text-foreground">
          {selected?.label ?? value}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[11rem]">
        {options.map((o) => (
          <DropdownMenuItem
            key={o.value}
            onSelect={() => onChange(o.value)}
            className="justify-between gap-6"
          >
            {o.label}
            {o.value === value && <Check className="h-4 w-4 text-[#3F6650]" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ToggleControl({
  label,
  checked,
  onCheckedChange,
  id,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
}) {
  const controlId = id ?? `toggle-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div className="inline-flex h-8 items-center gap-2 rounded-md border border-input bg-background px-2.5">
      <Switch
        id={controlId}
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
      <Label
        htmlFor={controlId}
        className="cursor-pointer text-[13px] font-medium text-foreground"
      >
        {label}
      </Label>
    </div>
  );
}

export function RefreshButton({
  onClick,
  loading,
  label = 'Refresh',
}: {
  onClick?: () => void;
  loading?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={cn(
        controlBase,
        'font-medium text-foreground disabled:opacity-50',
      )}
    >
      <RefreshCw
        className={cn(
          'h-3.5 w-3.5 text-muted-foreground',
          loading && 'animate-spin',
        )}
      />
      {label}
    </button>
  );
}
