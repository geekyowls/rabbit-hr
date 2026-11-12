'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { InitialsAvatar } from '@/components/ui/initials-avatar';
import type { PortalBranding } from '@/types/portal.type';

const NAV = [
  { href: '/portal', label: 'Home' },
  { href: '/portal/applications', label: 'Applications' },
  { href: '/portal/interviews', label: 'Interviews' },
  { href: '/portal/offers', label: 'Offers' },
  { href: '/portal/documents', label: 'Documents' },
  { href: '/portal/profile', label: 'Profile' },
];

function isActive(pathname: string, href: string) {
  const path = pathname.replace(/\/$/, '') || '/';
  if (href === '/portal') return path === '/portal';
  return path === href || path.startsWith(`${href}/`);
}

export function PortalBrandMark({
  organization,
  subtitle = 'Candidate portal',
}: {
  organization?: Pick<PortalBranding, 'name' | 'logo'> | null;
  subtitle?: string;
}) {
  if (!organization) {
    return (
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-5 w-32" />
      </div>
    );
  }
  return (
    <div className="flex min-w-0 items-center gap-3">
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
        <p className="truncate text-sm font-semibold">{organization.name}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

export function PortalFrame({
  header,
  nav,
  children,
}: {
  header: React.ReactNode;
  nav?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30 text-foreground dark:bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-3 px-4">
          {header}
        </div>
        {nav}
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
        {children}
      </main>
      <footer className="border-t border-border bg-background">
        <div className="mx-auto max-w-4xl px-4 py-4 text-xs text-muted-foreground">
          Powered by RabbitHR
        </div>
      </footer>
    </div>
  );
}

export function PortalShell({
  organization,
  brand,
  onSignOut,
  children,
}: {
  organization: PortalBranding;
  brand: string;
  onSignOut: () => void;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <PortalFrame
      header={
        <>
          <Link href="/portal" className="min-w-0">
            <PortalBrandMark organization={organization} />
          </Link>
          <Button variant="ghost" size="sm" onClick={onSignOut}>
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </>
      }
      nav={
        <nav className="mx-auto max-w-4xl overflow-x-auto px-2">
          <ul className="flex min-w-max gap-1">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'inline-flex border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
                      active
                        ? 'text-foreground'
                        : 'border-transparent text-muted-foreground hover:text-foreground',
                    )}
                    style={active ? { borderColor: brand } : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      }
    >
      {children}
    </PortalFrame>
  );
}
