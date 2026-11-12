'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@/lib/zod-resolver';
import {
  resetPasswordSchema,
  ResetPasswordFormData,
} from '@/schemas/auth.schema';
import { toast } from '@/lib/toast';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';
import { clearTokens } from '@/utils/cookies';
import { useAnalytics } from '@/hooks/use-analytics';

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  const { trackAuthEvent } = useAnalytics();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  useEffect(() => {
    trackAuthEvent('PASSWORD_RESET_PAGE_VIEWED', { hasToken: !!token });
    if (!token) {
      trackAuthEvent('PASSWORD_RESET_LINK_INVALID', {
        reason: 'missing_token',
      });
    }
  }, [token, trackAuthEvent]);

  if (!token) {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Invalid Link</CardTitle>
          <CardDescription className="text-center">
            This password reset link is invalid or has expired.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="text-center">
            <Link
              href="/forgot-password"
              className="text-sm text-primary underline underline-offset-4 hover:text-primary"
            >
              Request a new link
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const onSubmit = async (formData: ResetPasswordFormData) => {
    try {
      await fetchApi(API_ROUTES.AUTH.RESET_PASSWORD, {
        method: 'POST',
        body: JSON.stringify({ token, password: formData.password }),
      });

      clearTokens();
      trackAuthEvent('PASSWORD_RESET_COMPLETED');
      toast.success('Success', 'Your password has been reset successfully');
      setTimeout(() => router.push('/'), 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      trackAuthEvent('PASSWORD_RESET_FAILED', { error: message });
      toast.error('Error', message);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="pr-10"
                placeholder="••••••••"
                disabled={isSubmitting}
                {...register('password')}
              />
              <button
                type="button"
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

          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                className="pr-10"
                placeholder="••••••••"
                disabled={isSubmitting}
                {...register('confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Resetting...' : 'Reset password'}
          </Button>

          <div className="text-center">
            <Link
              href="/"
              className="text-sm text-primary underline underline-offset-4 hover:text-primary"
            >
              Back to login
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
