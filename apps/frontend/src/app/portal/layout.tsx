'use client';

import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/patterns';
import { IntegrationStatusPill } from '@/components/dashboard/integration-status-pill';
import {
  PortalBrandMark,
  PortalFrame,
  PortalShell,
} from '@/components/portal/portal-shell';
import {
  PortalSessionGate,
  usePortalSession,
} from '@/components/portal/portal-session';

function SignedInShell({ children }: { children: React.ReactNode }) {
  const { me, brand, signOut } = usePortalSession();
  return (
    <PortalShell
      organization={me.organization}
      brand={brand}
      onSignOut={() => void signOut()}
    >
      {children}
    </PortalShell>
  );
}

function LoadingFrame() {
  return (
    <PortalFrame header={<PortalBrandMark organization={null} />}>
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    </PortalFrame>
  );
}

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLogin = pathname.replace(/\/$/, '') === '/portal/login';

  return (
    <>
      {isLogin ? (
        children
      ) : (
        <PortalSessionGate
          loading={<LoadingFrame />}
          failed={(retry, signOut) => (
            <PortalFrame
              header={
                <span className="text-sm font-semibold">Candidate portal</span>
              }
            >
              <div className="rounded-xl border border-border bg-card">
                <EmptyState
                  title="We could not load your portal"
                  description="Check your connection and try again, or sign in again"
                  action={
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={retry}>
                        Try again
                      </Button>
                      <Button onClick={signOut}>Sign in again</Button>
                    </div>
                  }
                />
              </div>
            </PortalFrame>
          )}
        >
          <SignedInShell>{children}</SignedInShell>
        </PortalSessionGate>
      )}
      <IntegrationStatusPill />
    </>
  );
}
