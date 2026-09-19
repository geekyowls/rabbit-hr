'use client';

import { useSession } from '@/contexts/session-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
  requireSystemOrg?: boolean;
}

export function AuthGuard({ children, requireSystemOrg }: AuthGuardProps) {
  const { isAuthenticated, isLoading, organization } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && requireSystemOrg) {
      if (organization && !organization.isSystemOrg) {
        router.push('/dashboard');
      }
    }
  }, [isLoading, isAuthenticated, requireSystemOrg, organization, router]);

  if (isLoading || (requireSystemOrg && isAuthenticated && !organization)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black dark:border-white border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (requireSystemOrg && (!organization || !organization.isSystemOrg))
    return null;

  return <>{children}</>;
}
