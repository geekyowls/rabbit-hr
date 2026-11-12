'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { useApplicationQuery, useApplicationsQuery } from '@/hooks/queries';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import type { Application } from '@/types/application.type';

export function applicationLabel(app: Pick<Application, 'candidate' | 'job'>) {
  const name = `${app.candidate.firstName} ${app.candidate.lastName}`.trim();
  return `${name} · ${app.job.title}`;
}

export function ApplicationPicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 500);
  const { data, isFetching } = useApplicationsQuery(
    {
      page: 1,
      limit: 20,
      ...(debounced.trim() && { search: debounced.trim() }),
    },
    open,
  );
  const { data: selected } = useApplicationQuery(value || null);
  const options = data?.data ?? [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          className="flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-left text-sm disabled:cursor-not-allowed disabled:bg-muted/40"
        >
          <span
            className={cn('truncate', !selected && 'text-muted-foreground')}
          >
            {selected ? applicationLabel(selected) : 'Search candidate or job'}
          </span>
          {!disabled && (
            <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder="Search candidate or job"
          />
          <CommandList>
            <CommandEmpty>
              {isFetching ? 'Searching' : 'No applications found'}
            </CommandEmpty>
            <CommandGroup>
              {options.map((app) => (
                <CommandItem
                  key={app.id}
                  value={app.id}
                  onSelect={() => {
                    onChange(app.id);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2"
                >
                  <Check
                    className={cn(
                      'h-3.5 w-3.5 shrink-0',
                      app.id === value ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">
                      {app.candidate.firstName} {app.candidate.lastName}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {[app.job.title, app.job.client?.name]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
