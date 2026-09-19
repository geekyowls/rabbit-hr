'use client';

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  type KeyboardEvent,
} from 'react';
import { Check, ChevronsUpDown, Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useSession } from '@/contexts/session-context';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';
import { toast } from '@/lib/toast';
import type { ConfigItem } from '@/types/organization-config.type';
import { formatFreeTextLabel } from '@/lib/text';

type HealthConfigType = 'medical_condition' | 'allergy' | 'health_objective';

interface DynamicTagInputProps {
  value: string;
  onChange: (value: string) => void;
  configType?: HealthConfigType;
  suggestions?: string[];
  itemLabel?: string;
  placeholder?: string;
  disabled?: boolean;
}

const CONFIG_KEY_MAP: Record<
  HealthConfigType,
  'medicalConditions' | 'allergies' | 'healthObjectives'
> = {
  medical_condition: 'medicalConditions',
  allergy: 'allergies',
  health_objective: 'healthObjectives',
};

const LABEL_MAP: Record<HealthConfigType, string> = {
  medical_condition: 'condition',
  allergy: 'allergy',
  health_objective: 'objective',
};

export function DynamicTagInput({
  value,
  onChange,
  configType,
  suggestions,
  itemLabel,
  placeholder = 'Select...',
  disabled = false,
}: DynamicTagInputProps) {
  const { organizationConfig, setOrganizationConfig } = useSession();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const configKey = configType ? CONFIG_KEY_MAP[configType] : null;
  const label = itemLabel ?? (configType ? LABEL_MAP[configType] : 'item');
  const rawItems = configKey ? organizationConfig?.[configKey] : undefined;
  const availableItems: ConfigItem[] = useMemo(() => {
    if (rawItems) return rawItems;
    if (suggestions && suggestions.length > 0) {
      return suggestions.map((name) => ({
        id: `local-${name}`,
        name,
        isDefault: true,
      }));
    }
    return [];
  }, [rawItems, suggestions]);

  const uniqueItems = useMemo(() => {
    const seen = new Set<string>();
    return availableItems.filter((item) => {
      const key = item.name.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [availableItems]);

  const parseValue = useCallback((val: string): string[] => {
    return val
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }, []);

  const stringifyTags = useCallback((tags: string[]): string => {
    return tags.join(', ');
  }, []);

  const selectedItems = useMemo(() => {
    const parsed = parseValue(value);
    return parsed.map((tag) => {
      const lower = tag.toLowerCase();
      const match = uniqueItems.find(
        (item) => item.name.toLowerCase() === lower,
      );
      return match ? match.name : tag;
    });
  }, [value, uniqueItems, parseValue]);

  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const filteredItems = searchQuery
    ? uniqueItems.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : uniqueItems;

  const showAddNew =
    searchQuery.length > 0 &&
    !uniqueItems.some(
      (item) =>
        item.name.trim().toLowerCase() ===
        formatFreeTextLabel(searchQuery).toLowerCase(),
    );

  const maxIndex = filteredItems.length + (showAddNew ? 1 : 0) - 1;

  useEffect(() => {
    if (filteredItems.length === 0 && !showAddNew) {
      setActiveIndex(-1);
      return;
    }
    if (activeIndex < 0 || activeIndex > maxIndex) {
      setActiveIndex(0);
    }
  }, [filteredItems, showAddNew, activeIndex, maxIndex]);

  const isSelected = useCallback(
    (itemName: string) => {
      const lower = itemName.toLowerCase();
      return selectedItems.some((v) => v.toLowerCase() === lower);
    },
    [selectedItems],
  );

  const toggleItem = useCallback(
    (itemName: string) => {
      const lower = itemName.toLowerCase();
      if (selectedItems.some((v) => v.toLowerCase() === lower)) {
        onChange(
          stringifyTags(selectedItems.filter((v) => v.toLowerCase() !== lower)),
        );
      } else {
        onChange(stringifyTags([...selectedItems, itemName]));
      }
    },
    [selectedItems, onChange, stringifyTags],
  );

  const scrollToNewItem = useCallback((itemName: string, attempts = 0) => {
    requestAnimationFrame(() => {
      if (!scrollContainerRef.current) return;

      const element = scrollContainerRef.current.querySelector(
        `[data-item-name="${CSS.escape(itemName)}"]`,
      );

      if (element) {
        element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } else if (attempts < 30) {
        scrollToNewItem(itemName, attempts + 1);
      }
    });
  }, []);

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

  const handleCreate = async () => {
    const itemName = formatFreeTextLabel(searchQuery);
    if (!itemName) return;

    if (!configType || !configKey) {
      if (!isSelected(itemName)) {
        onChange(stringifyTags([...selectedItems, itemName]));
      }
      setSearchQuery('');
      scrollToNewItem(itemName);
      return;
    }

    setIsCreating(true);
    try {
      const newItem = await fetchApi<ConfigItem>(
        API_ROUTES.ORGANIZATION_CONFIG.CREATE,
        {
          method: 'POST',
          body: JSON.stringify({
            type: configType,
            name: itemName,
          }),
        },
      );

      if (organizationConfig) {
        const currentItems = organizationConfig[configKey] || [];
        setOrganizationConfig({
          ...organizationConfig,
          [configKey]: [...currentItems, newItem],
        });
      }

      if (!isSelected(itemName)) {
        onChange(stringifyTags([...selectedItems, itemName]));
      }
      setSearchQuery('');
      scrollToNewItem(itemName);
      toast.success(`"${itemName}" added`);
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message || 'Failed to create');
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setActiveIndex(-1);
    }
  }, [open]);

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
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
    if (event.key === 'Enter') {
      if (activeIndex < 0) return;
      event.preventDefault();
      if (activeIndex < filteredItems.length) {
        const item = filteredItems[activeIndex];
        if (item) {
          toggleItem(item.name);
        }
      } else if (showAddNew) {
        void handleCreate();
      }
    }
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between text-left font-normal h-10 px-3 rounded-md"
            disabled={disabled}
          >
            <span className="text-sm text-muted-foreground truncate">
              {selectedItems.length === 0
                ? placeholder
                : selectedItems.length <= 3
                  ? selectedItems.join(', ')
                  : `${selectedItems.slice(0, 2).join(', ')} +${selectedItems.length - 2} more`}
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
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                placeholder={`Search or create ${label}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full bg-transparent border-none focus:outline-none text-sm placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <div
            ref={scrollContainerRef}
            className="max-h-[300px] overflow-y-auto"
            onWheel={(event) => event.stopPropagation()}
          >
            {filteredItems.length === 0 && !showAddNew ? (
              <div className="p-4 text-sm text-center text-muted-foreground">
                No {label}s found
              </div>
            ) : (
              <div className="py-1">
                {filteredItems.map((item, index) => (
                  <div
                    key={item.id}
                    data-item-name={item.name}
                    data-item-index={index}
                    onClick={() => toggleItem(item.name)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted',
                      isSelected(item.name) && 'bg-muted',
                      activeIndex === index && 'ring-1 ring-primary',
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-4 w-4 items-center justify-center rounded-sm border',
                        isSelected(item.name)
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground/50',
                      )}
                    >
                      <Check
                        className={cn(
                          'h-3 w-3 text-primary-foreground',
                          isSelected(item.name) ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                    </div>
                    <span className="text-sm">{item.name}</span>
                  </div>
                ))}
                {showAddNew && (
                  <div
                    data-item-index={filteredItems.length}
                    onClick={handleCreate}
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted border-t text-primary"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="text-sm">
                      {isCreating
                        ? 'Creating...'
                        : `Create "${formatFreeTextLabel(searchQuery)}"`}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
