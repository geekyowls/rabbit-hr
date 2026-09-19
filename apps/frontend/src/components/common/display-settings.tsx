'use client';

import { Type } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
  useDisplayPrefs,
  type TextSize,
} from '@/contexts/display-prefs-context';

const SIZE_OPTIONS: Array<{ value: TextSize; label: string }> = [
  { value: 'sm', label: 'S' },
  { value: 'md', label: 'M' },
  { value: 'lg', label: 'L' },
  { value: 'xl', label: 'XL' },
];

export function DisplaySettings() {
  const { textSize, boldText, setPref } = useDisplayPrefs();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Display settings"
          className="flex h-7 w-7 items-center justify-center rounded-full border border-transparent bg-zinc-100 text-zinc-800 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          <Type className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Text size</p>
          <div className="grid grid-cols-4 gap-1">
            {SIZE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPref('textSize', option.value)}
                className={cn(
                  'rounded-md border py-1.5 text-sm transition-colors',
                  textSize === option.value
                    ? 'border-primary bg-primary/10 font-semibold text-primary'
                    : 'border-border hover:bg-muted',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="bold-text-toggle" className="text-sm">
            Bold text
          </Label>
          <Switch
            id="bold-text-toggle"
            checked={boldText}
            onCheckedChange={(checked) => setPref('boldText', checked)}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
