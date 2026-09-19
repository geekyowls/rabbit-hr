'use client';

import { Suspense } from 'react';
import LoginForm from '@/components/auth/login-form';
import { useSession } from '@/contexts/session-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const { isAuthenticated, isLoading, organization } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (organization?.isSystemOrg) {
        router.push('/system');
      } else {
        router.push('/dashboard');
      }
    }
  }, [isLoading, isAuthenticated, organization, router]);

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black dark:border-white border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0e5c3e] to-[#062e1f]" />
        <div className="relative z-20 flex items-center gap-2 text-lg font-medium">
          <svg
            className="h-8 w-8 text-white"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="RabbitHR logo"
            role="img"
          >
            <circle cx="16" cy="16" r="14" fill="currentColor" />
            <path
              d="M10 16c0-3.314 2.686-6 6-6s6 2.686 6 6-2.686 6-6 6"
              stroke="#0e5c3e"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="16" cy="16" r="2" fill="#0e5c3e" />
          </svg>
          <span className="text-xl font-bold">RabbitHR</span>
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;The complete CRM and diet management platform for
              dietitians and health coaches.&rdquo;
            </p>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
