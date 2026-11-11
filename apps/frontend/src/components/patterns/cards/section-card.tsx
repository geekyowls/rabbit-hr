'use client';

import * as React from 'react';
import { Info, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function SectionCard({
  icon: Icon,
  title,
  subtitle,
  info,
  actions,
  children,
  className,
  bodyClassName,
}: {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  info?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
        <div className="flex items-center gap-2 min-w-0">
          {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-sm font-semibold">{title}</h3>
              {info && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">{info}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            {subtitle && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
      <div className={cn('p-6', bodyClassName)}>{children}</div>
    </Card>
  );
}
