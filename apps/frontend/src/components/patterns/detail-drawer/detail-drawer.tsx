'use client';

import * as React from 'react';
import { ChevronLeft, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

export function DetailDrawer({
  open,
  onOpenChange,
  title,
  onBack,
  chips,
  footer,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onBack?: () => void;
  chips?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        hideClose
        className={cn(
          'flex w-full flex-col gap-0 overflow-visible bg-background p-0 sm:max-w-xl',
          className,
        )}
      >
        <div className="absolute left-0 top-4 z-50 flex -translate-x-[calc(100%+8px)] flex-col overflow-hidden rounded-md border border-border bg-background shadow-md">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="-ml-2 h-8 gap-1 px-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          <SheetTitle className="truncate text-base font-semibold">
            {title}
          </SheetTitle>
          {chips && (
            <div className="ml-auto flex items-center gap-2">{chips}</div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && (
          <div className="border-t border-border px-5 py-4">{footer}</div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function DetailPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('space-y-6', className)}>{children}</div>;
}

export function PanelSection({
  icon,
  title,
  action,
  children,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          {icon}
          <span>{title}</span>
        </div>
        {action}
      </div>
      <div>{children}</div>
    </section>
  );
}
