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

interface CountryComboboxProps {
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export function CountryCombobox({
  value,
  onValueChange,
  disabled,
}: CountryComboboxProps) {
  const [open, setOpen] = useState(false);

  const selectedCountry = COUNTRIES.find((country) => country.code2 === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedCountry ? selectedCountry.name : 'Select country...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search country..." />
          <CommandList onWheel={(e) => e.stopPropagation()}>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {COUNTRIES.map((country) => (
                <CommandItem
                  key={country.code2}
                  value={`${country.name} ${country.code2}`}
                  onSelect={() => {
                    onValueChange(country.code2);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === country.code2 ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <span>
                    {country.name}{' '}
                    <span className="text-muted-foreground">
                      ({country.code2})
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
