'use client';

import * as React from 'react';
import { ChevronDown, ChevronLeft, ChevronUp, X } from 'lucide-react';
import { IconButton } from '../toolbar';
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
          'flex w-full flex-col gap-0 bg-background p-0 sm:max-w-xl',
          className,
        )}
      >
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
          <div className="ml-auto flex items-center gap-2">
            {chips}
            <DrawerNavControls onClose={() => onOpenChange(false)} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && (
          <div className="border-t border-border px-5 py-4">{footer}</div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function DrawerNavControls({
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  prevLabel = 'Previous',
  nextLabel = 'Next',
}: {
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  prevLabel?: string;
  nextLabel?: string;
}) {
  const showNav = !!(onPrev || onNext);
  return (
    <div className="flex shrink-0 items-center gap-1">
      {showNav && (
        <>
          <IconButton
            icon={ChevronUp}
            label={prevLabel}
            onClick={onPrev}
            disabled={!hasPrev}
          />
          <IconButton
            icon={ChevronDown}
            label={nextLabel}
            onClick={onNext}
            disabled={!hasNext}
          />
          <span className="mx-1 h-5 w-px bg-border" />
        </>
      )}
      <IconButton icon={X} label="Close" onClick={onClose} />
    </div>
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
