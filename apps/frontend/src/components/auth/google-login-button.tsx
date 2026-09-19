'use client';

import { useState, useCallback } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import { useSession } from '@/contexts/session-context';
import { useAnalytics } from '@/hooks/use-analytics';
import { buildApiUrl, API_ROUTES } from '@/config/api-routes';
import { getUserFromToken } from '@/utils/auth';
import { setToken, setRefreshToken } from '@/utils/cookies';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import type { GoogleLoginResponse } from '@/types/user.type';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

interface GoogleLoginButtonProps {
  label?: string;
  onNewUser?: () => void;
}

export function GoogleLoginButton({
  label = 'Continue with Google',
  onNewUser,
}: GoogleLoginButtonProps) {
  const router = useRouter();
  const { setUser, loadFullSession } = useSession();
  const { trackAuthEvent } = useAnalytics();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleToken = useCallback(
    async (accessToken: string) => {
      setIsLoading(true);
      try {
        const response = await fetch(buildApiUrl(API_ROUTES.AUTH.GOOGLE), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken }),
        });

        const data = await response.json();

        if (!response.ok) {
          trackAuthEvent('LOGIN_FAILED', {
            error: data.message || 'Google authentication failed',
            method: 'google',
          });
          toast.error(
            'Google sign-in failed',
            data.message || 'Authentication failed',
          );
          return;
        }

        const loginData: GoogleLoginResponse = data.data;

        setToken(loginData.accessToken);
        setRefreshToken(loginData.refreshToken);

        trackAuthEvent('LOGIN_SUCCESS', {
          isSystemOrg: loginData.isSystemOrg,
          method: 'google',
          isNewUser: loginData.isNewUser,
        });

        if (loginData.isNewUser && !onNewUser) {
          trackAuthEvent('GOOGLE_SIGNUP_COMPLETED');
          toast.success('Account created', 'Welcome to RabbitHR!');
          router.push('/signup?context=true');
          return;
        }

        const jwtUser = getUserFromToken(loginData.accessToken);
        if (jwtUser) {
          setUser(jwtUser);
        }

        if (loginData.isNewUser && onNewUser) {
          trackAuthEvent('GOOGLE_SIGNUP_COMPLETED');
          onNewUser();
          await loadFullSession(loginData.accessToken);
        } else {
          await loadFullSession(loginData.accessToken);
          toast.success('Success', 'Logged in successfully');
          if (loginData.isSystemOrg) {
            router.push('/system');
          } else {
            router.push('/dashboard');
          }
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Google sign-in failed';
        trackAuthEvent('LOGIN_FAILED', { error: message, method: 'google' });
        toast.error('Google sign-in failed', message);
      } finally {
        setIsLoading(false);
      }
    },
    [router, setUser, loadFullSession, trackAuthEvent, onNewUser],
  );

  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      handleGoogleToken(tokenResponse.access_token);
    },
    onError: () => {
      toast.error('Google sign-in failed', 'Please try again');
    },
  });

  if (!GOOGLE_CLIENT_ID) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={() => googleLogin()}
      disabled={isLoading}
    >
      <GoogleIcon className="mr-2 h-4 w-4" />
      {isLoading ? 'Signing in...' : label}
    </Button>
  );
}
