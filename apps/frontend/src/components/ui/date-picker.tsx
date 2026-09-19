'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { CalendarIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

interface DatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  clearable?: boolean;
  formatDisplay?: (date: Date) => string;
  showDropdowns?: boolean;
  fromYear?: number;
  toYear?: number;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  disabled = false,
  minDate,
  maxDate,
  className,
  clearable = false,
  formatDisplay,
  showDropdowns = false,
  fromYear,
  toYear,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (date: Date | undefined) => {
    onChange(date);
    if (date) setOpen(false);
  };

  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const currentYear = new Date().getFullYear();
  const effectiveFromYear = fromYear ?? currentYear - 100;
  const effectiveToYear = toYear ?? currentYear;

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'h-10 w-full justify-start text-left font-normal rounded-md shadow-none bg-background dark:bg-background',
            !value && 'text-muted-foreground',
            className,
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span className="flex-1 truncate">
            {value
              ? formatDisplay
                ? formatDisplay(value)
                : format(value, 'PPP')
              : placeholder}
          </span>
          {clearable && value && (
            <X
              className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onChange(undefined);
              }}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleSelect}
          disabled={isDateDisabled}
          captionLayout={showDropdowns ? 'dropdown-buttons' : undefined}
          fromYear={showDropdowns ? effectiveFromYear : undefined}
          toYear={showDropdowns ? effectiveToYear : undefined}
          defaultMonth={value}
        />
      </PopoverContent>
    </Popover>
  );
}
