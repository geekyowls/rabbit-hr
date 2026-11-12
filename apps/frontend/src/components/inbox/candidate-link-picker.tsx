'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { useCandidatesQuery } from '@/hooks/queries';
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

export interface PickedCandidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export function CandidateLinkPicker({
  onSelect,
  trigger,
  disabled,
}: {
  onSelect: (candidate: PickedCandidate) => void;
  trigger?: React.ReactNode;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 500);
  const { data, isFetching } = useCandidatesQuery(
    {
      page: 1,
      limit: 20,
      ...(debounced.trim() && { search: debounced.trim() }),
    },
    open,
  );
  const options = data?.data ?? [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        {trigger ?? (
          <button
            type="button"
            className="inline-flex h-7 items-center gap-1.5 rounded-md border border-dashed border-border px-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Link candidate
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder="Search candidates"
          />
          <CommandList>
            <CommandEmpty>
              {isFetching ? 'Searching' : 'No candidates found'}
            </CommandEmpty>
            <CommandGroup>
              {options.map((c) => (
                <CommandItem
                  key={c.id}
                  value={c.id}
                  onSelect={() => {
                    onSelect({
                      id: c.id,
                      firstName: c.firstName,
                      lastName: c.lastName,
                      email: c.email,
                    });
                    setOpen(false);
                  }}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">
                      {c.firstName} {c.lastName}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {c.email}
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
