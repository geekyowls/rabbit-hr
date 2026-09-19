'use client';

import { PermissionScope } from '@/constants/permissions.constants';
import { cn } from '@/lib/utils';

const SCOPES = [
  { value: PermissionScope.OWN, label: 'Own' },
  { value: PermissionScope.TEAM, label: 'Team' },
  { value: PermissionScope.ALL, label: 'All' },
] as const;

interface ScopeSelectorProps {
  value: PermissionScope | null;
  onChange: (scope: PermissionScope) => void;
  disabled?: boolean;
}

export function ScopeSelector({
  value,
  onChange,
  disabled,
}: ScopeSelectorProps) {
  return (
    <div className="inline-flex items-center rounded-md border border-input bg-background p-0.5">
      {SCOPES.map((scope) => {
        const isActive = value === scope.value;
        return (
          <button
            key={scope.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(scope.value)}
            className={cn(
              'px-2.5 py-0.5 text-xs font-medium rounded-sm transition-colors',
              isActive
                ? 'bg-zinc-900 text-zinc-50 shadow-sm dark:bg-zinc-50 dark:text-zinc-900'
                : 'text-muted-foreground hover:bg-muted',
              disabled && 'opacity-50 cursor-not-allowed',
            )}
          >
            {scope.label}
          </button>
        );
      })}
    </div>
  );
}
