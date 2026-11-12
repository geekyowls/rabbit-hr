'use client';

import { CalendarX2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { InitialsAvatar } from '@/components/ui/initials-avatar';
import { EmptyState } from '@/components/patterns';

export function BookingShell({
  companyName,
  companyLogo,
  loading,
  children,
}: {
  companyName?: string | null;
  companyLogo?: string | null;
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30 text-foreground dark:bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-4 sm:px-6">
          {loading ? (
            <>
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-5 w-40" />
            </>
          ) : companyName ? (
            <>
              {companyLogo ? (
                <img
                  src={companyLogo}
                  alt={companyName}
                  className="h-9 w-9 shrink-0 rounded-lg object-contain"
                />
              ) : (
                <InitialsAvatar
                  name={companyName}
                  className="h-9 w-9 shrink-0 rounded-lg text-sm"
                />
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{companyName}</p>
                <p className="text-xs text-muted-foreground">
                  Interview booking
                </p>
              </div>
            </>
          ) : (
            <span className="text-sm font-semibold">Interview booking</span>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
      <footer className="border-t border-border bg-background">
        <div className="mx-auto max-w-3xl px-4 py-4 text-xs text-muted-foreground sm:px-6">
          Powered by RabbitHR
        </div>
      </footer>
    </div>
  );
}

export function BookingNotice({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <EmptyState
        icon={icon ?? <CalendarX2 className="h-10 w-10" />}
        title={title}
        description={description}
        action={action}
      />
    </div>
  );
}
