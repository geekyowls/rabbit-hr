'use client';

import { useState, useCallback, KeyboardEvent } from 'react';
import { X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface TagInputWithSuggestionsProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  disabled?: boolean;
}

export function TagInputWithSuggestions({
  value,
  onChange,
  suggestions,
  placeholder = 'Type to add...',
  disabled = false,
}: TagInputWithSuggestionsProps) {
  const [inputValue, setInputValue] = useState('');

  const parseValue = useCallback((val: string): string[] => {
    return val
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }, []);

  const stringifyTags = useCallback((tags: string[]): string => {
    return tags.join(', ');
  }, []);

  const selectedTags = parseValue(value);

  const isSelected = useCallback(
    (tag: string) => {
      return selectedTags.some((t) => t.toLowerCase() === tag.toLowerCase());
    },
    [selectedTags],
  );

  const addTag = useCallback(
    (tag: string) => {
      const trimmed = tag.trim();
      if (!trimmed) return;

      if (isSelected(trimmed)) return;

      const newTags = [...selectedTags, trimmed];
      onChange(stringifyTags(newTags));
    },
    [selectedTags, isSelected, onChange, stringifyTags],
  );

  const removeTag = useCallback(
    (tag: string) => {
      const newTags = selectedTags.filter(
        (t) => t.toLowerCase() !== tag.toLowerCase(),
      );
      onChange(stringifyTags(newTags));
    },
    [selectedTags, onChange, stringifyTags],
  );

  const toggleSuggestion = useCallback(
    (suggestion: string) => {
      if (isSelected(suggestion)) {
        removeTag(suggestion);
      } else {
        addTag(suggestion);
      }
    },
    [isSelected, removeTag, addTag],
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
      setInputValue('');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <Button
            key={suggestion}
            type="button"
            variant={isSelected(suggestion) ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => toggleSuggestion(suggestion)}
            disabled={disabled}
            className={cn(
              'h-7 text-xs',
              isSelected(suggestion) && 'bg-zinc-200 dark:bg-zinc-700',
            )}
          >
            {isSelected(suggestion) && <Check className="h-3 w-3 mr-1" />}
            {suggestion}
          </Button>
        ))}
      </div>

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                disabled={disabled}
                className="ml-1 rounded-full hover:bg-zinc-300 dark:hover:bg-zinc-600 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="space-y-1">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          Press Enter or comma to add custom values
        </p>
      </div>
    </div>
  );
}
