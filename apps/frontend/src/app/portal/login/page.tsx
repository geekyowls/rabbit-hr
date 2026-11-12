'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { AlertCircle, ArrowLeft, Mail, SearchX } from 'lucide-react';
import { zodResolver } from '@/lib/zod-resolver';
import { ApiError } from '@/utils/error-class';
import {
  getPortalOrgSlug,
  hasPortalSession,
  setPortalOrgSlug,
  setPortalTokens,
} from '@/utils/portal-tokens';
import {
  usePortalBrandingQuery,
  useRequestPortalOtpMutation,
  useVerifyPortalOtpMutation,
} from '@/hooks/queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/patterns';
import { PortalBrandMark, PortalFrame } from '@/components/portal/portal-shell';
import { DEFAULT_PORTAL_BRAND } from '@/components/portal/portal-utils';
import { careersListHref } from '@/components/careers/careers-utils';

const emailSchema = z.object({
  email: z.email('Enter a valid email address'),
});

const codeSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter the 6 digit code'),
});

type EmailForm = z.infer<typeof emailSchema>;
type CodeForm = z.infer<typeof codeSchema>;

function loginError(err: unknown) {
  if (err instanceof ApiError && err.statusCode === 429) return err.message;
  if (err instanceof ApiError && err.statusCode === 404) {
    return 'The candidate portal is not available for this company';
  }
  return err instanceof Error && err.message
    ? err.message
    : 'Something went wrong, please try again';
}

function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function NotAvailable({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-border bg-card">
      <EmptyState
        icon={<SearchX className="h-10 w-10" />}
        title={title}
        description={description}
      />
    </div>
  );
}

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const orgSlug = params.get('org')?.trim() || getPortalOrgSlug();
  const initialEmail = params.get('email')?.trim() ?? '';
  const branding = usePortalBrandingQuery(orgSlug);
  const requestOtp = useRequestPortalOtpMutation();
  const verifyOtp = useVerifyPortalOtpMutation();
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: initialEmail },
  });
  const codeForm = useForm<CodeForm>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: '' },
  });

  useEffect(() => {
    if (hasPortalSession() && getPortalOrgSlug() === orgSlug) {
      router.replace('/portal');
    }
  }, [orgSlug, router]);

  const brand = branding.data?.brandColor || DEFAULT_PORTAL_BRAND;

  const sendCode = async (value: string) => {
    setError(null);
    await requestOtp.mutateAsync({ orgSlug: orgSlug!, email: value });
    setEmail(value);
    setNotice(`If ${value} is linked to an application, a code is on its way`);
    codeForm.reset({ code: '' });
  };

  const onEmail = async (values: EmailForm) => {
    try {
      await sendCode(values.email.trim().toLowerCase());
    } catch (err) {
      setError(loginError(err));
    }
  };

  const onCode = async (values: CodeForm) => {
    if (!email || !orgSlug) return;
    setError(null);
    try {
      const result = await verifyOtp.mutateAsync({
        orgSlug,
        email,
        code: values.code.trim(),
      });
      setPortalTokens(result.accessToken, result.refreshToken);
      setPortalOrgSlug(result.organization.slug);
      router.replace('/portal');
    } catch (err) {
      setError(loginError(err));
    }
  };

  const resend = async () => {
    if (!email) return;
    try {
      await sendCode(email);
    } catch (err) {
      setError(loginError(err));
    }
  };

  let body: React.ReactNode;
  if (!orgSlug) {
    body = (
      <NotAvailable
        title="Open your portal link"
        description="Use the link from your email or the careers page of the company you applied to"
      />
    );
  } else if (branding.isLoading) {
    body = <Skeleton className="mx-auto h-72 w-full max-w-md rounded-xl" />;
  } else if (!branding.data) {
    body = (
      <NotAvailable
        title="Portal not found"
        description="This link may be out of date. Check the address or contact the company directly"
      />
    );
  } else if (!branding.data.portalEnabled) {
    body = (
      <NotAvailable
        title="Candidate portal is not available"
        description={`${branding.data.name} has not turned on the candidate portal yet`}
      />
    );
  } else {
    body = (
      <div className="mx-auto w-full max-w-md space-y-4">
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <div className="mb-5 space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">
              {email ? 'Check your email' : 'Sign in to your portal'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {email
                ? 'Enter the 6 digit code we sent you. It expires in 10 minutes.'
                : 'Track your applications, interviews, offers and documents. Use the email you applied with.'}
            </p>
          </div>

          {email ? (
            <form
              onSubmit={codeForm.handleSubmit(onCode)}
              className="space-y-4"
              noValidate
            >
              {notice && (
                <div className="flex items-start gap-2 rounded-lg bg-muted px-3 py-2.5 text-sm text-muted-foreground">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{notice}</span>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="portal-code">Sign in code</Label>
                <Input
                  id="portal-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  autoFocus
                  placeholder="000000"
                  className="h-11 text-center text-lg tracking-[0.4em]"
                  {...codeForm.register('code')}
                />
                {codeForm.formState.errors.code && (
                  <p className="text-sm text-destructive">
                    {codeForm.formState.errors.code.message}
                  </p>
                )}
              </div>
              <ErrorNote message={error} />
              <Button
                type="submit"
                className="w-full text-white hover:opacity-90"
                style={{ backgroundColor: brand }}
                disabled={codeForm.formState.isSubmitting}
              >
                {codeForm.formState.isSubmitting ? 'Signing in...' : 'Sign in'}
              </Button>
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setEmail(null);
                    setError(null);
                  }}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Use another email
                </button>
                <button
                  type="button"
                  className="font-medium hover:underline disabled:opacity-50"
                  onClick={resend}
                  disabled={requestOtp.isPending}
                >
                  Send a new code
                </button>
              </div>
            </form>
          ) : (
            <form
              onSubmit={emailForm.handleSubmit(onEmail)}
              className="space-y-4"
              noValidate
            >
              <div className="space-y-1.5">
                <Label htmlFor="portal-email">Email</Label>
                <Input
                  id="portal-email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="you@example.com"
                  className="h-10"
                  {...emailForm.register('email')}
                />
                {emailForm.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {emailForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <ErrorNote message={error} />
              <Button
                type="submit"
                className="w-full text-white hover:opacity-90"
                style={{ backgroundColor: brand }}
                disabled={emailForm.formState.isSubmitting}
              >
                {emailForm.formState.isSubmitting
                  ? 'Sending code...'
                  : 'Email me a code'}
              </Button>
            </form>
          )}
        </div>
        <p className="text-center text-xs text-muted-foreground">
          New here?{' '}
          <Link
            href={careersListHref(branding.data.slug)}
            className="font-medium text-foreground hover:underline"
          >
            Browse open roles
          </Link>{' '}
          and apply to create your portal
        </p>
      </div>
    );
  }

  return (
    <PortalFrame
      header={
        <PortalBrandMark
          organization={
            orgSlug && !branding.isLoading
              ? (branding.data ?? { name: 'Candidate portal', logo: null })
              : orgSlug
                ? null
                : { name: 'Candidate portal', logo: null }
          }
        />
      }
    >
      <div className="py-4 sm:py-10">{body}</div>
    </PortalFrame>
  );
}

export default function PortalLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
