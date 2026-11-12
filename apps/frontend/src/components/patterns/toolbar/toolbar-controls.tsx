'use client';

import * as React from 'react';
import {
  ChevronDown,
  Download,
  Upload,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const pill =
  'inline-flex h-8 items-center gap-1.5 rounded-md border text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50';

const variants = {
  default: 'border-input bg-background text-foreground hover:bg-accent',
  primary:
    'border-transparent bg-[#3F6650] text-white hover:bg-[#355847] shadow-sm',
  ghost:
    'border-transparent text-muted-foreground hover:bg-accent hover:text-foreground',
  danger:
    'border-transparent bg-red-600 text-white hover:bg-red-600/90 shadow-sm',
} as const;

export type ToolbarButtonVariant = keyof typeof variants;

export function ToolbarButton({
  variant = 'default',
  icon: Icon,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ToolbarButtonVariant;
  icon?: LucideIcon;
}) {
  return (
    <button
      type="button"
      className={cn(pill, variants[variant], 'px-2.5', className)}
      {...props}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
    </button>
  );
}

export function IconButton({
  icon: Icon,
  label,
  active,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: LucideIcon;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        pill,
        'w-8 justify-center border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
        active && 'bg-accent text-foreground',
        className,
      )}
      {...props}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export function ExportButton({
  formats = ['CSV', 'Excel', 'PDF'],
  onExport,
}: {
  formats?: string[];
  onExport?: (format: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(pill, variants.default, 'px-2.5')}>
        <Download className="h-3.5 w-3.5 text-muted-foreground" />
        Export
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[8rem]">
        {formats.map((f) => (
          <DropdownMenuItem key={f} onSelect={() => onExport?.(f)}>
            Export as {f}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ImportButton({
  onClick,
  label = 'Import',
}: {
  onClick?: () => void;
  label?: string;
}) {
  return (
    <ToolbarButton icon={Upload} onClick={onClick}>
      {label}
    </ToolbarButton>
  );
}

export function MultiFilter({
  label,
  icon: Icon,
  count,
  options,
  selected,
  onToggle,
}: {
  label: string;
  icon?: LucideIcon;
  count?: number;
  options: { label: string; value: string }[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const activeCount = count ?? selected.length;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(pill, variants.default, 'px-2.5')}>
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        <span className="text-foreground">{label}</span>
        {activeCount > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-sm bg-[#3F6650] px-1 text-[10px] font-semibold text-white">
            {activeCount}
          </span>
        )}
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[11rem]">
        {options.map((o) => {
          const on = selected.includes(o.value);
          return (
            <DropdownMenuItem
              key={o.value}
              onSelect={(e) => {
                e.preventDefault();
                onToggle(o.value);
              }}
              className="gap-2"
            >
              <span
                className={cn(
                  'flex h-4 w-4 items-center justify-center rounded border',
                  on
                    ? 'border-[#3F6650] bg-[#3F6650] text-white'
                    : 'border-input',
                )}
              >
                {on && <X className="h-3 w-3" />}
              </span>
              {o.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export interface ActiveFilter {
  key: string;
  label: string;
  value: string;
}

export function FilterChips({
  filters,
  onRemove,
  onClearAll,
}: {
  filters: ActiveFilter[];
  onRemove: (key: string) => void;
  onClearAll?: () => void;
}) {
  if (filters.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {filters.map((f) => (
        <span
          key={f.key}
          className="inline-flex h-7 items-center gap-1 rounded-sm border border-input bg-muted/50 pl-2.5 pr-1 text-xs"
        >
          <span className="text-muted-foreground">{f.label}:</span>
          <span className="font-medium text-foreground">{f.value}</span>
          <button
            type="button"
            onClick={() => onRemove(f.key)}
            className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label={`Remove ${f.label}`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      {onClearAll && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Clear all
        </button>
      )}
    </div>
  );
}

export function SelectionBar({
  count,
  actions,
  onClear,
  className,
}: {
  count: number;
  actions: React.ReactNode;
  onClear: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-lg border border-[#3F6650]/30 bg-[#EDF1EE] px-3 py-2 dark:border-[#3F6650]/40 dark:bg-[#3F6650]/15',
        className,
      )}
    >
      <span className="text-sm font-medium text-[#16201A] dark:text-[#8FBFA1]">
        {count} selected
      </span>
      <span className="h-4 w-px bg-[#3F6650]/20" />
      <div className="flex flex-wrap items-center gap-1.5">{actions}</div>
      <button
        type="button"
        onClick={onClear}
        className="ml-auto text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        Deselect all
      </button>
    </div>
  );
}
