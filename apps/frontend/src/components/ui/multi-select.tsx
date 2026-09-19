'use client';

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type KeyboardEvent,
} from 'react';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface Option {
  label: string;
  value: string;
}

interface MultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  hidePills?: boolean;
}

export function MultiSelect({
  options,
  value,
  onChange,
  disabled,
  placeholder = 'Select options...',
  hidePills,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchQuery) {
      const filtered = options.filter((option) =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions(options);
    }
  }, [searchQuery, options]);

  useEffect(() => {
    if (filteredOptions.length === 0) {
      setActiveIndex(-1);
      return;
    }
    if (activeIndex >= filteredOptions.length) {
      setActiveIndex(filteredOptions.length - 1);
    }
  }, [filteredOptions, activeIndex]);

  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setActiveIndex(-1);
    }
  }, [open]);

  const scrollToIndex = useCallback((index: number) => {
    requestAnimationFrame(() => {
      if (!scrollContainerRef.current) return;
      const element = scrollContainerRef.current.querySelector<HTMLElement>(
        `[data-item-index="${index}"]`,
      );
      if (element) {
        element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });
  }, []);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setActiveIndex(0);
  };

  const toggleOption = useCallback(
    (optionValue: string) => {
      if (value.includes(optionValue)) {
        onChange(value.filter((v) => v !== optionValue));
      } else {
        onChange([...value, optionValue]);
      }
    },
    [value, onChange],
  );

  const handleRemove = (optionValue: string) => {
    onChange(value.filter((v) => v !== optionValue));
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const maxIndex = filteredOptions.length - 1;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (maxIndex < 0) return;
      setActiveIndex((prev) => {
        const next = prev < 0 || prev >= maxIndex ? 0 : prev + 1;
        scrollToIndex(next);
        return next;
      });
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (maxIndex < 0) return;
      setActiveIndex((prev) => {
        const next = prev <= 0 ? maxIndex : prev - 1;
        scrollToIndex(next);
        return next;
      });
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
        event.preventDefault();
        const option = filteredOptions[activeIndex];
        if (option) {
          toggleOption(option.value);
        }
      }
      return;
    }

    if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between text-left font-normal h-10 px-3 rounded-md shadow-none bg-white dark:bg-zinc-950"
            disabled={disabled}
          >
            <span className="text-sm">
              {value.length > 0
                ? `${value.length} option${value.length === 1 ? '' : 's'} selected`
                : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0 shadow-lg rounded-md"
          style={{ width: 'var(--radix-popover-trigger-width)' }}
          align="start"
        >
          <div className="px-3 py-2 border-b">
            <div className="flex items-center gap-2 px-2 py-1 bg-muted rounded-md">
              <Search className="h-4 w-4 text-gray-400 dark:text-gray-600" />
              <input
                placeholder="Search options..."
                value={searchQuery}
                onChange={handleSearchInputChange}
                onKeyDown={handleSearchKeyDown}
                className="w-full bg-transparent border-none focus:outline-none text-sm placeholder:text-gray-400"
              />
            </div>
          </div>
          <div
            ref={scrollContainerRef}
            className="max-h-[300px] overflow-auto"
            onWheel={(event) => event.stopPropagation()}
          >
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-sm text-center text-gray-500 dark:text-gray-400">
                No options found
              </div>
            ) : (
              <div className="py-1">
                {filteredOptions.map((option, index) => (
                  <div
                    key={option.value}
                    data-item-index={index}
                    onClick={() => toggleOption(option.value)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted',
                      value.includes(option.value) && 'bg-muted/50',
                      activeIndex === index && 'ring-1 ring-primary',
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-4 w-4 items-center justify-center rounded-sm border',
                        value.includes(option.value)
                          ? 'border-gray-900 bg-gray-900 dark:border-gray-600 dark:bg-gray-600'
                          : 'border-gray-300 dark:border-gray-600',
                      )}
                    >
                      <Check
                        className={cn(
                          'h-3 w-3 text-white',
                          value.includes(option.value)
                            ? 'opacity-100'
                            : 'opacity-0',
                        )}
                      />
                    </div>
                    <span className="text-sm">{option.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {value.length > 0 && !hidePills && (
        <div className="flex flex-wrap gap-2">
          {value.map((optionValue) => {
            const option = options.find((o) => o.value === optionValue);
            return (
              <div
                key={optionValue}
                className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full px-3 py-1.5 text-sm"
              >
                <span className="text-gray-700 dark:text-gray-300">
                  {option?.label || optionValue}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(optionValue)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
