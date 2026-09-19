'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setToken } from '@/utils/cookies';
import { getUserFromToken } from '@/utils/auth';
import { useSession } from '@/contexts/session-context';

function SystemAccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useSession();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setError('No access token provided');
      return;
    }

    try {
      const userData = getUserFromToken(token);
      if (!userData) {
        setError('Invalid or expired token');
        return;
      }

      setToken(token);
      setUser(userData);
      router.replace('/dashboard');
    } catch {
      setError('Failed to process access token');
    }
  }, [searchParams, router, setUser]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <button
            onClick={() => window.close()}
            className="text-sm text-muted-foreground hover:underline"
          >
            Close this tab
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-black dark:border-white border-t-transparent" />
        <p className="text-sm text-muted-foreground">
          Accessing organization dashboard...
        </p>
      </div>
    </div>
  );
}

export default function SystemAccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-black dark:border-white border-t-transparent" />
        </div>
      }
    >
      <SystemAccessContent />
    </Suspense>
  );
}
