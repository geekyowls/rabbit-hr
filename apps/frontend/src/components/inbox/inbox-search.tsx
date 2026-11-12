'use client';

import { Search, SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { InboxLinkedFilter, InboxSearchIn } from '@/types/inbox.type';
import { LINKED_OPTIONS, SEARCH_IN_OPTIONS } from './inbox-utils';

export type LinkedValue = InboxLinkedFilter | 'any';

function ChipGroup<V extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: V;
  options: { value: V; label: string }[];
  onChange: (value: V) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              'h-7 rounded-full border px-3 text-xs transition-colors',
              o.value === value
                ? 'border-transparent bg-[#DCE7DF] font-medium text-[#2F4D3C] dark:bg-[#3F6650]/40 dark:text-[#CFE3D6]'
                : 'border-border text-foreground/80 hover:bg-muted',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function InboxSearch({
  search,
  onSearchChange,
  searchIn,
  onSearchInChange,
  linked,
  onLinkedChange,
  unreadOnly,
  onUnreadOnlyChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  searchIn: InboxSearchIn;
  onSearchInChange: (value: InboxSearchIn) => void;
  linked: LinkedValue;
  onLinkedChange: (value: LinkedValue) => void;
  unreadOnly: boolean;
  onUnreadOnlyChange: (value: boolean) => void;
}) {
  const filtered = searchIn !== 'all' || linked !== 'any' || unreadOnly;

  return (
    <div className="relative flex h-11 min-w-0 max-w-3xl flex-1 items-center rounded-full bg-muted transition-colors focus-within:bg-background focus-within:shadow-md focus-within:ring-1 focus-within:ring-border">
      <Search className="pointer-events-none absolute left-4 h-4 w-4 text-muted-foreground" />
      <input
        type="search"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search mail"
        aria-label="Search mail"
        className="h-full min-w-0 flex-1 bg-transparent pl-12 pr-2 text-sm outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
      />
      {search && (
        <button
          type="button"
          aria-label="Clear search"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
          onClick={() => onSearchChange('')}
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Search options"
            title="Search options"
            className="relative mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {filtered && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#3F6650] dark:bg-[#8FBFA1]" />
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 space-y-4 p-4">
          <ChipGroup
            label="Search in"
            value={searchIn}
            options={SEARCH_IN_OPTIONS}
            onChange={onSearchInChange}
          />
          <ChipGroup
            label="Linked"
            value={linked}
            options={LINKED_OPTIONS}
            onChange={onLinkedChange}
          />
          <div className="flex items-center justify-between">
            <Label htmlFor="inbox-unread-only" className="text-sm">
              Unread only
            </Label>
            <Switch
              id="inbox-unread-only"
              checked={unreadOnly}
              onCheckedChange={onUnreadOnlyChange}
            />
          </div>
          {filtered && (
            <button
              type="button"
              className="text-xs font-medium text-[#3F6650] hover:underline dark:text-[#8FBFA1]"
              onClick={() => {
                onSearchInChange('all');
                onLinkedChange('any');
                onUnreadOnlyChange(false);
              }}
            >
              Reset filters
            </button>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
