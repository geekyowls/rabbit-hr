'use client';

import { Suspense, useState } from 'react';
import SignupForm from '@/components/auth/signup-form';
import { useSession } from '@/contexts/session-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

function SignupPageContent() {
  const { isAuthenticated, isLoading, organization } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPostAuthFlow =
    searchParams.get('welcome') === 'true' ||
    searchParams.get('context') === 'true';
  const [skipRedirect, setSkipRedirect] = useState(isPostAuthFlow);

  useEffect(() => {
    if (!isLoading && isAuthenticated && !skipRedirect) {
      if (organization?.isSystemOrg) {
        router.push('/system');
      } else {
        router.push('/dashboard');
      }
    }
  }, [isLoading, isAuthenticated, organization, router, skipRedirect]);

  if ((isLoading || isAuthenticated) && !skipRedirect) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black dark:border-white border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-[#3F6650] to-[#16201A]" />
        <div className="relative z-20 flex items-center gap-2 text-lg font-medium">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
            <img
              src="/logo-r-64.png"
              alt="RabbitHR logo"
              className="h-6 w-6 object-contain brightness-0 invert"
            />
          </span>
          <span className="text-xl font-bold">RabbitHR</span>
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;Jobs, candidates and clients for your agency, in one
              place&rdquo;
            </p>
            <footer className="text-sm text-zinc-400">
              Free for one recruiter, upgrade when your team grows
            </footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
          <SignupForm onAuthenticated={() => setSkipRedirect(true)} />
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-black dark:border-white border-t-transparent" />
        </div>
      }
    >
      <SignupPageContent />
    </Suspense>
  );
}
