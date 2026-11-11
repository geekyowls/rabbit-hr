'use client';

import { cn } from '@/lib/utils';

export interface CategoryChip<T extends string> {
  value: T;
  label: string;
  count?: number;
}

export function CategoryChips<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: CategoryChip<T>[];
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={cn(
              'inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors',
              active
                ? 'border-[#3F6650] bg-[#3F6650] text-white dark:border-[#8FBFA1] dark:bg-[#8FBFA1] dark:text-[#0f1a14]'
                : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span
                className={cn(
                  'tabular-nums',
                  active ? 'opacity-80' : 'text-muted-foreground/70',
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
