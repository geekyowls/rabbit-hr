'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InitialsAvatar } from '@/components/ui/initials-avatar';
import type { UserSummary } from '@/types/common.type';
import { personLabel } from './interview-data';

export function InterviewerPicker({
  users,
  value,
  onChange,
}: {
  users: UserSummary[];
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {users.length === 0 && (
        <p className="text-xs text-muted-foreground">Loading team members</p>
      )}
      {users.map((user) => {
        const name = personLabel(user);
        const selected = value.includes(user.id);
        return (
          <button
            key={user.id}
            type="button"
            onClick={() =>
              onChange(
                selected
                  ? value.filter((id) => id !== user.id)
                  : [...value, user.id],
              )
            }
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border py-0.5 pl-0.5 pr-2.5 text-xs font-medium transition-colors',
              selected
                ? 'border-[#3F6650] bg-[#EDF1EE] text-[#3F6650] dark:bg-[#3F6650]/25 dark:text-[#8FBFA1]'
                : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <InitialsAvatar name={name} className="h-5 w-5 text-[9px]" />
            {name}
            {selected && <Check className="h-3 w-3" />}
          </button>
        );
      })}
    </div>
  );
}
