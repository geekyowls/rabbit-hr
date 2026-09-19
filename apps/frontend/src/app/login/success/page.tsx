'use client';

import { Suspense } from 'react';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getUserFromToken } from '@/utils/auth';
import { useSession } from '@/contexts/session-context';
import { setToken } from '@/utils/cookies';

function LoginSuccessContent() {
  const router = useRouter();
  const { setUser } = useSession();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('data');

    if (!token) {
      router.push('/');
      return;
    }

    setToken(token);
    const user = getUserFromToken(token);

    if (user) {
      setUser(user);
      router.push('/dashboard');
    } else {
      router.push('/');
    }
  }, [router, searchParams, setUser]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-dark-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-black dark:border-white border-t-transparent" />
    </div>
  );
}

export default function LoginSuccess() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-black dark:border-white border-t-transparent" />
        </div>
      }
    >
      <LoginSuccessContent />
    </Suspense>
  );
}
