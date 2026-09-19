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
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@/lib/zod-resolver';
import {
  forgotPasswordSchema,
  ForgotPasswordFormData,
} from '@/schemas/auth.schema';
import { toast } from '@/lib/toast';
import Link from 'next/link';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';
import { useAnalytics } from '@/hooks/use-analytics';

export default function ForgotPasswordForm() {
  const { trackAuthEvent, identify } = useAnalytics();
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (formData: ForgotPasswordFormData) => {
    try {
      await fetchApi(API_ROUTES.AUTH.FORGOT_PASSWORD, {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      setIsSuccess(true);
      identify(formData.email, { email: formData.email });
      trackAuthEvent('PASSWORD_RESET_REQUESTED', { email: formData.email });
      toast.success('Success', 'Password reset link sent to your email');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      trackAuthEvent('PASSWORD_RESET_REQUEST_FAILED', {
        email: formData.email,
        error: message,
      });
      toast.error('Error', message);
    }
  };

  if (isSuccess) {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            Check your email
          </CardTitle>
          <CardDescription className="text-center">
            We&apos;ve sent a password reset link to {getValues('email')}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="text-center">
            <Link
              href="/"
              className="text-sm text-primary underline underline-offset-4 hover:text-primary"
            >
              Back to login
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              disabled={isSubmitting}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>
          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send reset link'}
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
