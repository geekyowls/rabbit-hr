'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function EntityCard({
  name,
  subtitle,
  avatarSrc,
  meta,
  tags,
  actions,
  onClick,
  className,
}: {
  name: string;
  subtitle?: string;
  avatarSrc?: string;
  meta?: React.ReactNode;
  tags?: React.ReactNode;
  actions?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-lg border border-border bg-card p-3',
        onClick &&
          'cursor-pointer transition-colors hover:border-foreground/20',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-9 w-9">
          {avatarSrc && <AvatarImage src={avatarSrc} alt={name} />}
          <AvatarFallback className="text-xs">{initials(name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-medium">{name}</p>
            {actions}
          </div>
          {subtitle && (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {meta && <div className="mt-2 text-xs text-muted-foreground">{meta}</div>}
      {tags && <div className="mt-2 flex flex-wrap gap-1">{tags}</div>}
    </div>
  );
}
