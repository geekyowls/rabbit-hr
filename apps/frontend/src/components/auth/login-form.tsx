'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@/lib/zod-resolver';
import { loginSchema, LoginFormData } from '@/schemas/auth.schema';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from '@/contexts/session-context';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { toast } from '@/lib/toast';
import { buildApiUrl, API_ROUTES } from '@/config/api-routes';
import { getUserFromToken } from '@/utils/auth';
import { setToken, setRefreshToken } from '@/utils/cookies';
import { LoginResponse } from '@/types/user.type';
import { useAnalytics } from '@/hooks/use-analytics';
import { GoogleLoginButton } from './google-login-button';

export default function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setUser, loadFullSession } = useSession();
  const { trackAuthEvent } = useAnalytics();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState(
    searchParams.get('error') || '',
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (formData: LoginFormData) => {
    setServerError('');

    try {
      const response = await fetch(buildApiUrl(API_ROUTES.AUTH.LOGIN), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        trackAuthEvent('LOGIN_FAILED', {
          email: formData.email,
          error: data.message || 'Authentication failed',
        });
        toast.error('Failed to login', data.message || 'Authentication failed');
        return;
      }

      const loginData: LoginResponse = data.data;

      setToken(loginData.accessToken);
      setRefreshToken(loginData.refreshToken);

      const jwtUser = getUserFromToken(loginData.accessToken);
      if (jwtUser) {
        setUser(jwtUser);
      }

      await loadFullSession(loginData.accessToken);

      trackAuthEvent('LOGIN_SUCCESS', {
        email: formData.email,
        isSystemOrg: loginData.isSystemOrg,
      });
      toast.success('Success', 'Logged in successfully');

      if (loginData.isSystemOrg) {
        router.push('/system');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Invalid email or password';
      trackAuthEvent('LOGIN_FAILED', { email: formData.email, error: message });
      setServerError(message);
      toast.error('Error logging in', message);
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Sign in</CardTitle>
        <p className="text-center text-sm">Enter your credentials to sign in</p>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="pr-10"
                {...register('password')}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>
          {serverError && (
            <div className="text-sm text-red-500 text-center">
              {serverError}
            </div>
          )}
          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
          <GoogleLoginButton label="Sign in with Google" />
          <div className="text-sm text-center text-muted-foreground">
            <a
              href="/forgot-password"
              className="underline underline-offset-4 hover:text-primary"
            >
              Forgot your password?
            </a>
          </div>
          <div className="text-sm text-center text-muted-foreground">
            Don&apos;t have an account?{' '}
            <a
              href="/signup"
              className="underline underline-offset-4 hover:text-primary"
            >
              Sign up
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
