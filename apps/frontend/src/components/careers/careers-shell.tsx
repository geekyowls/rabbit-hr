'use client';

import Link from 'next/link';
import { ExternalLink, LogIn, SearchX } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { InitialsAvatar } from '@/components/ui/initials-avatar';
import { EmptyState } from '@/components/patterns';
import type { CareersOrganization } from '@/types/careers.type';
import { careersListHref } from './careers-utils';

export function CareersShell({
  organization,
  loading,
  children,
}: {
  organization?: CareersOrganization | null;
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30 text-foreground dark:bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          {loading ? (
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-5 w-40" />
            </div>
          ) : organization ? (
            <Link
              href={careersListHref(organization.slug)}
              className="flex min-w-0 items-center gap-3"
            >
              {organization.logo ? (
                <img
                  src={organization.logo}
                  alt={organization.name}
                  className="h-9 w-9 shrink-0 rounded-lg object-contain"
                />
              ) : (
                <InitialsAvatar
                  name={organization.name}
                  className="h-9 w-9 shrink-0 rounded-lg text-sm"
                />
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {organization.name}
                </p>
                <p className="text-xs text-muted-foreground">Careers</p>
              </div>
            </Link>
          ) : (
            <span className="text-sm font-semibold">Careers</span>
          )}
          <div className="flex shrink-0 items-center gap-4">
            {organization?.website && (
              <a
                href={organization.website}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground sm:inline-flex"
              >
                Website
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            {organization?.portalEnabled && (
              <Link
                href={`/portal/login?org=${encodeURIComponent(organization.slug)}`}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm font-medium hover:bg-muted"
              >
                <LogIn className="h-3.5 w-3.5" />
                Candidate login
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
      <footer className="border-t border-border bg-background">
        <div className="mx-auto max-w-5xl px-4 py-4 text-xs text-muted-foreground sm:px-6">
          Powered by RabbitHR
        </div>
      </footer>
    </div>
  );
}

export function CareersNotFound({
  title = 'Careers page not found',
  description = 'This link may be out of date. Check the address or contact the company directly.',
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <EmptyState
        icon={<SearchX className="h-10 w-10" />}
        title={title}
        description={description}
        action={action}
      />
    </div>
  );
}
