'use client';

import { useState, useMemo } from 'react';
import { Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { SavedView } from '@/types/page-preferences.type';

interface FilterLabelMap {
  [key: string]: {
    label: string;
    valueLabels?: Record<string, string>;
  };
}

interface SavedViewsBarProps {
  views: SavedView[];
  currentFilters: Record<string, string>;
  onApplyView: (filters: Record<string, string>) => void;
  onSaveView: (name: string, filters: Record<string, string>) => void;
  onDeleteView: (name: string) => void;
  onRenameView: (oldName: string, newName: string) => void;
  onUpdateView: (name: string, filters: Record<string, string>) => void;
  validateViewName?: (name: string, excludeName?: string) => string | null;
  isSaving?: boolean;
  filterLabelMap?: FilterLabelMap;
  allLabel?: string;
  maxViews?: number;
}

function filtersMatch(
  a: Record<string, string>,
  b: Record<string, string>,
): boolean {
  if (!a || !b) return false;
  const aKeys = Object.keys(a).filter((k) => a[k] && a[k] !== 'all');
  const bKeys = Object.keys(b).filter((k) => b[k] && b[k] !== 'all');
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((k) => a[k] === b[k]);
}

function hasActiveFilters(filters: Record<string, string>): boolean {
  if (!filters) return false;
  return Object.values(filters).some((v) => v && v !== 'all' && v !== '');
}

function getFilterSummary(
  filters: Record<string, string>,
  labelMap?: FilterLabelMap,
): string[] {
  if (!filters) return [];
  return Object.entries(filters)
    .filter(([, v]) => v && v !== 'all' && v !== '')
    .map(([key, value]) => {
      const config = labelMap?.[key];
      const label = config?.label ?? key;
      const parts = value.split(',').filter(Boolean);
      const valueLabel = parts
        .map((part) => config?.valueLabels?.[part] ?? part)
        .join(', ');
      return `${label}: ${valueLabel}`;
    });
}

function cleanFilters(filters: Record<string, string>): Record<string, string> {
  if (!filters) return {};
  const cleaned: Record<string, string> = {};
  for (const [k, v] of Object.entries(filters)) {
    if (v && v !== 'all' && v !== '') cleaned[k] = v;
  }
  return cleaned;
}

export function SavedViewsBar({
  views,
  currentFilters,
  onApplyView,
  onSaveView,
  onDeleteView,
  onRenameView,
  onUpdateView,
  validateViewName,
  isSaving,
  filterLabelMap,
  allLabel = 'All',
  maxViews,
}: SavedViewsBarProps) {
  const [savePopoverOpen, setSavePopoverOpen] = useState(false);
  const [viewName, setViewName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [renameName, setRenameName] = useState('');
  const [renameError, setRenameError] = useState<string | null>(null);
  const [selectedViewName, setSelectedViewName] = useState<string | null>(null);

  const isAllActive = !hasActiveFilters(currentFilters);

  const activeViewName = useMemo(() => {
    if (isAllActive) return null;
    const matching = views.filter((v) =>
      filtersMatch(v.filters, currentFilters),
    );
    if (matching.length === 0) return null;
    return (matching.find((v) => v.name === selectedViewName) ?? matching[0])
      .name;
  }, [views, currentFilters, isAllActive, selectedViewName]);

  const canSave =
    hasActiveFilters(currentFilters) &&
    !activeViewName &&
    views.length < (maxViews ?? Infinity);

  const handleSave = () => {
    const trimmed = viewName.trim();
    if (!trimmed) return;
    const error = validateViewName?.(trimmed);
    if (error) {
      setNameError(error);
      return;
    }
    onSaveView(trimmed, cleanFilters(currentFilters));
    setViewName('');
    setNameError(null);
    setSavePopoverOpen(false);
  };

  const handleRename = () => {
    if (!renameTarget) return;
    const trimmed = renameName.trim();
    if (!trimmed) return;
    const error = validateViewName?.(trimmed, renameTarget);
    if (error) {
      setRenameError(error);
      return;
    }
    onRenameView(renameTarget, trimmed);
    if (selectedViewName === renameTarget) setSelectedViewName(trimmed);
    setRenameTarget(null);
    setRenameName('');
    setRenameError(null);
  };

  return (
    <TooltipProvider>
      <div
        role="tablist"
        aria-label="Saved searches"
        className="flex items-end gap-0.5 overflow-x-auto overflow-y-hidden scrollbar-hide border-b border-zinc-200 dark:border-zinc-800"
      >
        <button
          type="button"
          role="tab"
          aria-selected={isAllActive}
          onClick={() => {
            setSelectedViewName(null);
            onApplyView({});
          }}
          className={cn(
            'px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:focus-visible:ring-zinc-300 rounded-t-sm',
            isAllActive
              ? 'border-green-600 dark:border-green-500 text-zinc-900 dark:text-zinc-50'
              : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50',
          )}
        >
          {allLabel}
        </button>

        {canSave && (
          <Popover
            open={savePopoverOpen}
            onOpenChange={(open) => {
              setSavePopoverOpen(open);
              if (!open) {
                setNameError(null);
                setViewName('');
              }
            }}
          >
            <Tooltip delayDuration={400}>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="-mb-px ml-2 lg:order-last inline-flex items-center gap-1 border-b-2 border-transparent rounded-t-sm px-3 py-2 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-300"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Save search
                  </button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Save active filters as a named search
              </TooltipContent>
            </Tooltip>
            <PopoverContent className="w-64 p-3" align="start">
              <div className="space-y-2">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Name this saved search
                </p>
                <Input
                  placeholder="e.g. Renewal due, No diet..."
                  value={viewName}
                  onChange={(e) => {
                    setViewName(e.target.value);
                    setNameError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave();
                  }}
                  className="h-8 text-sm"
                  autoFocus
                />
                {nameError && (
                  <p className="text-xs text-destructive">{nameError}</p>
                )}
                <Button
                  size="sm"
                  className="w-full h-7 text-xs"
                  onClick={handleSave}
                  disabled={!viewName.trim() || isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save search'}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {views.map((view, index) => {
          const isActive = activeViewName === view.name;
          const isSelectedModified =
            selectedViewName === view.name &&
            !isActive &&
            !activeViewName &&
            hasActiveFilters(currentFilters) &&
            !filtersMatch(view.filters, currentFilters);
          const showActions =
            isActive ||
            (selectedViewName === view.name &&
              !isActive &&
              hasActiveFilters(currentFilters) &&
              !filtersMatch(view.filters, currentFilters));
          const summary = getFilterSummary(view.filters, filterLabelMap);
          const actionBtnBase =
            'rounded p-0.5 transition-colors text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800';

          return (
            <div
              key={view.name || `view-${index}`}
              role="tab"
              aria-selected={isActive}
              className={cn(
                'group inline-flex items-center -mb-px border-b-2 transition-colors whitespace-nowrap rounded-t-md',
                isActive
                  ? 'border-b-green-700 dark:border-b-green-500 border-x border-t border-green-300 dark:border-green-800 bg-zinc-50 dark:bg-zinc-900'
                  : isSelectedModified
                    ? 'border-b-green-500 dark:border-b-green-600 border-x border-t border-green-200 dark:border-green-800'
                    : 'border-transparent',
              )}
            >
              <Tooltip delayDuration={400}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedViewName(view.name);
                      onApplyView(view.filters);
                    }}
                    className={cn(
                      'pl-3 pr-1.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-300 focus-visible:ring-offset-1 rounded-t-sm',
                      isActive || isSelectedModified || showActions
                        ? 'text-zinc-900 dark:text-zinc-50'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50',
                    )}
                  >
                    {view.name}
                  </button>
                </TooltipTrigger>
                {summary.length > 0 && (
                  <TooltipContent
                    side="bottom"
                    className="text-xs max-w-[200px]"
                  >
                    <div className="space-y-0.5">
                      {summary.map((s) => (
                        <div key={s}>{s}</div>
                      ))}
                    </div>
                  </TooltipContent>
                )}
              </Tooltip>

              {showActions && (
                <div className="flex items-center gap-0.5 pr-1.5">
                  {(isSelectedModified || (showActions && !isActive)) && (
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          aria-label={`Update "${view.name}" with current filters`}
                          onClick={() =>
                            onUpdateView(
                              view.name,
                              cleanFilters(currentFilters),
                            )
                          }
                          disabled={isSaving}
                          className={cn(
                            actionBtnBase,
                            'hover:text-amber-600 dark:hover:text-amber-400',
                          )}
                        >
                          <RefreshCw className="h-3 w-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        Update with current filters
                      </TooltipContent>
                    </Tooltip>
                  )}

                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label={`Rename "${view.name}"`}
                        onClick={() => {
                          setRenameName(view.name);
                          setRenameError(null);
                          setRenameTarget(view.name);
                        }}
                        className={cn(
                          actionBtnBase,
                          'hover:text-blue-600 dark:hover:text-blue-400',
                        )}
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      Rename
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label={`Delete "${view.name}"`}
                        onClick={() => setDeleteTarget(view.name)}
                        className={cn(
                          actionBtnBase,
                          'hover:text-red-600 dark:hover:text-red-400',
                        )}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      Delete
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Dialog
        open={!!renameTarget}
        onOpenChange={(open) => {
          if (!open) {
            setRenameTarget(null);
            setRenameName('');
            setRenameError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Rename saved search</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Input
              value={renameName}
              onChange={(e) => {
                setRenameName(e.target.value);
                setRenameError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
              }}
              autoFocus
            />
            {renameError && (
              <p className="text-xs text-destructive">{renameError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRenameTarget(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleRename}
              disabled={!renameName.trim() || isSaving}
            >
              {isSaving ? 'Saving...' : 'Rename'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete saved search</AlertDialogTitle>
            <AlertDialogDescription>
              Delete &ldquo;
              <span className="font-medium">{deleteTarget}</span>&rdquo;? This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  if (selectedViewName === deleteTarget)
                    setSelectedViewName(null);
                  onDeleteView(deleteTarget);
                  setDeleteTarget(null);
                }
              }}
              className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-900 dark:hover:bg-red-800"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
