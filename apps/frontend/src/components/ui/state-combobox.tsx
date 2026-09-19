'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { COUNTRIES } from '@boilerplate/shared';

interface StateComboboxProps {
  value?: string;
  onValueChange: (value: string) => void;
  countryCode?: string;
  disabled?: boolean;
}

export function StateCombobox({
  value,
  onValueChange,
  countryCode,
  disabled,
}: StateComboboxProps) {
  const [open, setOpen] = useState(false);

  const country = COUNTRIES.find((c) => c.code2 === countryCode);
  const states = country?.states || [];
  const isDisabled = disabled || !countryCode || states.length === 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={isDisabled}
        >
          {value || 'Select state...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search state..." />
          <CommandList onWheel={(e) => e.stopPropagation()}>
            <CommandEmpty>No state found.</CommandEmpty>
            <CommandGroup>
              {states.map((state) => (
                <CommandItem
                  key={state.code}
                  value={state.name}
                  onSelect={() => {
                    onValueChange(state.name);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === state.name ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {state.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
