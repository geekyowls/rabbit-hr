'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/contexts/session-context';

export function DemoGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { organization, isLoading } = useSession();
  const allowed = !!organization?.canUseDemoScreens;

  useEffect(() => {
    if (!isLoading && !allowed) {
      router.replace('/dashboard');
    }
  }, [isLoading, allowed, router]);

  if (isLoading || !allowed) return null;

  return <>{children}</>;
}
