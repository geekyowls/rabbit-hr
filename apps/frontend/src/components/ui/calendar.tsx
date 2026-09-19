'use client';

import * as React from 'react';
import { DayPicker, DropdownProps } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function CalendarDropdown({
  value,
  onChange,
  children,
  ...props
}: DropdownProps) {
  const options = React.Children.toArray(children) as React.ReactElement<
    React.HTMLProps<HTMLOptionElement>
  >[];
  const selected = options.find((child) => child.props.value === value);

  const handleChange = (newValue: string) => {
    const changeEvent = {
      target: { value: newValue },
    } as React.ChangeEvent<HTMLSelectElement>;
    onChange?.(changeEvent);
  };

  return (
    <Select value={value?.toString()} onValueChange={handleChange} {...props}>
      <SelectTrigger className="h-7 pr-1.5 focus:ring-0 font-medium border-none shadow-none">
        <SelectValue>{selected?.props?.children}</SelectValue>
      </SelectTrigger>
      <SelectContent
        position="popper"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <ScrollArea className="h-80">
          {options.map((option, index) => (
            <SelectItem
              key={option.props.value?.toString() ?? index}
              value={option.props.value?.toString() ?? ''}
            >
              {option.props.children}
            </SelectItem>
          ))}
        </ScrollArea>
      </SelectContent>
    </Select>
  );
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-medium',
        caption_dropdowns: 'flex justify-center gap-1',
        dropdown_month: '[&>span]:hidden',
        dropdown_year: '[&>span]:hidden',
        vhidden: 'hidden',
        nav: 'space-x-1 flex items-center',
        nav_button: cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
        ),
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex',
        head_cell:
          'text-zinc-500 rounded-md w-8 font-normal text-[0.8rem] dark:text-zinc-400',
        row: 'flex w-full mt-2',
        cell: cn(
          'relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-zinc-100 [&:has([aria-selected].day-outside)]:bg-zinc-100/50 [&:has([aria-selected].day-range-end)]:rounded-r-md dark:[&:has([aria-selected])]:bg-zinc-800 dark:[&:has([aria-selected].day-outside)]:bg-zinc-800/50',
          props.mode === 'range'
            ? '[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md'
            : '[&:has([aria-selected])]:rounded-md',
        ),
        day: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-8 w-8 p-0 font-normal aria-selected:opacity-100',
        ),
        day_range_start: 'day-range-start',
        day_range_end: 'day-range-end',
        day_selected:
          'bg-zinc-200 text-zinc-900 ring-2 ring-zinc-400 ring-inset hover:bg-zinc-200 focus:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-50 dark:ring-zinc-500',
        day_today:
          'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50',
        day_outside:
          'day-outside text-zinc-500 aria-selected:bg-zinc-100/50 aria-selected:text-zinc-500 dark:text-zinc-400 dark:aria-selected:bg-zinc-800/50 dark:aria-selected:text-zinc-400',
        day_disabled: 'text-zinc-500 opacity-50 dark:text-zinc-400',
        day_range_middle:
          'aria-selected:bg-zinc-100 aria-selected:text-zinc-900 dark:aria-selected:bg-zinc-800 dark:aria-selected:text-zinc-50',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }: { className?: string }) => (
          <ChevronLeftIcon className={cn('h-4 w-4', className)} {...props} />
        ),
        IconRight: ({ className, ...props }: { className?: string }) => (
          <ChevronRightIcon className={cn('h-4 w-4', className)} {...props} />
        ),
        Dropdown: CalendarDropdown,
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
