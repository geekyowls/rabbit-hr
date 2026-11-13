'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/ui/phone-input';
import { CountryCombobox } from '@/components/ui/country-combobox';
import {
  AGENCY_SIZE_LABELS,
  AGENCY_SIZES,
  PHONE_CODES,
  PLANS,
} from '@boilerplate/shared';
import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  choosePlanHref,
  clearPlanIntent,
  parsePlanIntent,
  readPlanIntent,
  savePlanIntent,
} from '@/components/billing/billing-links';
import { useBillingSummary } from '@/hooks/queries/use-billing-query';
import { zodResolver } from '@/lib/zod-resolver';
import {
  sendOtpSchema,
  SendOtpFormData,
  verifyOtpSchema,
  VerifyOtpFormData,
  signupDetailsSchema,
  SignupDetailsFormData,
  signupContextSchema,
  SignupContextFormData,
} from '@/schemas/auth.schema';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from '@/contexts/session-context';
import {
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { toast } from '@/lib/toast';
import { buildApiUrl, API_ROUTES } from '@/config/api-routes';
import { getUserFromToken } from '@/utils/auth';
import { setToken, setRefreshToken } from '@/utils/cookies';
import { LoginResponse } from '@/types/user.type';
import Link from 'next/link';
import { useAnalytics } from '@/hooks/use-analytics';
import { SignupStepper, type SignupStep } from './signup-stepper';
import { fetchApi } from '@/utils/api-client';
import { Mail, CheckCircle } from 'lucide-react';
import { GoogleLoginButton } from './google-login-button';
import { cn } from '@/lib/utils';

const STEP_HEADERS: Record<SignupStep, { title: string; subtitle: string }> = {
  email: {
    title: 'Create your agency workspace',
    subtitle: 'Free forever for one recruiter, no card needed',
  },
  otp: {
    title: 'Verify your email',
    subtitle: 'Enter the code we sent to your inbox',
  },
  details: {
    title: 'Set up your workspace',
    subtitle: 'Tell us who you are and the name of your agency',
  },
  context: {
    title: 'About your agency',
    subtitle: 'This helps us tailor RabbitHR to your team',
  },
  welcome: {
    title: 'Welcome to RabbitHR',
    subtitle: 'Your workspace is ready',
  },
  'waitlist-thanks': {
    title: 'Thanks for your interest',
    subtitle: 'We will be in touch soon',
  },
};

function getInitialStep(searchParams: URLSearchParams): SignupStep {
  if (searchParams.get('context') === 'true') return 'context';
  if (searchParams.get('welcome') === 'true') return 'welcome';
  return 'email';
}

export default function SignupForm({
  onAuthenticated,
}: {
  onAuthenticated?: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, loadFullSession } = useSession();
  const [step, setStep] = useState<SignupStep>(getInitialStep(searchParams));

  useEffect(() => {
    savePlanIntent(
      parsePlanIntent(searchParams.get('plan'), searchParams.get('billing')),
    );
  }, [searchParams]);
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [askAgencyName, setAskAgencyName] = useState(
    getInitialStep(searchParams) === 'context',
  );

  const header = STEP_HEADERS[step];

  return (
    <Card className="transition-all duration-300">
      <CardHeader className="space-y-1">
        <SignupStepper currentStep={step} />
        <CardTitle className="text-2xl text-center">{header.title}</CardTitle>
        <p className="text-center text-sm text-muted-foreground">
          {step === 'otp' ? (
            <>
              Enter the code we sent to{' '}
              <span className="font-medium text-foreground">
                {verifiedEmail}
              </span>
            </>
          ) : (
            header.subtitle
          )}
        </p>
      </CardHeader>
      <CardContent className="overflow-hidden">
        <div key={step} className="animate-slide-in-right">
          {step === 'email' && (
            <EmailStep
              onSuccess={(email) => {
                setVerifiedEmail(email);
                setStep('otp');
              }}
              onGoogleNewUser={() => {
                onAuthenticated?.();
                setAskAgencyName(true);
                setStep('context');
              }}
            />
          )}
          {step === 'otp' && (
            <OtpStep
              email={verifiedEmail}
              onSuccess={() => setStep('details')}
            />
          )}
          {step === 'details' && (
            <DetailsStep
              email={verifiedEmail}
              onSuccess={async (result) => {
                if (result.waitlistMode) {
                  setStep('waitlist-thanks');
                  return;
                }
                setToken(result.accessToken);
                setRefreshToken(result.refreshToken);
                onAuthenticated?.();
                const jwtUser = getUserFromToken(result.accessToken);
                if (jwtUser) {
                  setUser(jwtUser);
                }
                await loadFullSession(result.accessToken);
                setStep('context');
              }}
            />
          )}
          {step === 'context' && (
            <ContextStep
              askAgencyName={askAgencyName}
              onSuccess={() => setStep('welcome')}
            />
          )}
          {step === 'welcome' && (
            <WelcomeStep onContinue={(href) => router.push(href)} />
          )}
          {step === 'waitlist-thanks' && (
            <WaitlistThanksStep onDone={() => router.push('/')} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmailStep({
  onSuccess,
  onGoogleNewUser,
}: {
  onSuccess: (email: string) => void;
  onGoogleNewUser: () => void;
}) {
  const { trackAuthEvent } = useAnalytics();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SendOtpFormData>({
    resolver: zodResolver(sendOtpSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: SendOtpFormData) => {
    try {
      const response = await fetch(
        buildApiUrl(API_ROUTES.AUTH.SEND_SIGNUP_OTP),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: data.email }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        toast.error('Failed to send OTP', result.message || 'Please try again');
        return;
      }

      toast.success(
        'OTP sent',
        'Please check your email for the verification code',
      );
      trackAuthEvent('SIGNUP_OTP_SENT');
      onSuccess(data.email);
      trackAuthEvent('SIGNUP_STARTED');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong';
      toast.error('Failed to send OTP', message);
    }
  };

  return (
    <div className="grid gap-4">
      <GoogleLoginButton
        label="Sign up with Google"
        onNewUser={onGoogleNewUser}
      />
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@agency.co.uk"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            We&apos;ll send a verification code to your email
          </p>
        </div>

        <Button className="w-full" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Sending code...' : 'Continue'}
        </Button>

        <div className="text-sm text-center text-muted-foreground">
          Already have an account?{' '}
          <Link
            href="/"
            className="underline underline-offset-4 hover:text-primary"
          >
            Sign in
          </Link>
        </div>
      </form>
    </div>
  );
}

function OtpStep({
  email,
  onSuccess,
}: {
  email: string;
  onSuccess: () => void;
}) {
  const { trackAuthEvent } = useAnalytics();
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerifyOtpFormData>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { email, otp: '' },
  });

  const onSubmit = async (data: VerifyOtpFormData) => {
    try {
      const response = await fetch(
        buildApiUrl(API_ROUTES.AUTH.VERIFY_SIGNUP_OTP),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: data.email, otp: data.otp }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        toast.error(
          'Verification failed',
          result.message || 'Please try again',
        );
        return;
      }

      toast.success('Email verified', 'Please complete your registration');
      trackAuthEvent('SIGNUP_OTP_VERIFIED');
      onSuccess();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong';
      toast.error('Verification failed', message);
    }
  };

  const startCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      const response = await fetch(
        buildApiUrl(API_ROUTES.AUTH.SEND_SIGNUP_OTP),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        toast.error(
          'Failed to resend OTP',
          result.message || 'Please try again',
        );
        return;
      }

      toast.success('OTP resent', 'Please check your email');
      trackAuthEvent('SIGNUP_OTP_RESENT');
      startCooldown();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong';
      toast.error('Failed to resend OTP', message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid gap-2">
        <Label>Email</Label>
        <div className="flex items-center gap-2 rounded-md border bg-muted px-3 py-2 text-sm">
          <Mail className="h-4 w-4 text-muted-foreground" />
          {email}
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="otp">Verification code</Label>
        <Input
          id="otp"
          placeholder="123456"
          maxLength={6}
          className="text-center text-lg tracking-widest"
          {...register('otp')}
        />
        {errors.otp && (
          <p className="text-sm text-red-500">{errors.otp.message}</p>
        )}
      </div>

      <Button className="w-full" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Verifying...' : 'Verify'}
      </Button>

      <div className="text-sm text-center text-muted-foreground">
        Didn&apos;t receive the code?{' '}
        <button
          type="button"
          onClick={handleResend}
          disabled={isResending || resendCooldown > 0}
          className="underline underline-offset-4 hover:text-primary disabled:opacity-50 disabled:no-underline"
        >
          {isResending
            ? 'Sending...'
            : resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : 'Resend OTP'}
        </button>
      </div>
    </form>
  );
}

type DetailsStepResult =
  | { waitlistMode: true }
  | { waitlistMode: false; accessToken: string; refreshToken: string };

function DetailsStep({
  email,
  onSuccess,
}: {
  email: string;
  onSuccess: (result: DetailsStepResult) => void | Promise<void>;
}) {
  const { trackAuthEvent } = useAnalytics();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupDetailsFormData>({
    resolver: zodResolver(signupDetailsSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      password: '',
      confirmPassword: '',
      organizationName: '',
    },
  });

  const onSubmit = async (data: SignupDetailsFormData) => {
    try {
      const response = await fetch(buildApiUrl(API_ROUTES.AUTH.REGISTER), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          firstName: data.firstName,
          lastName: data.lastName || undefined,
          password: data.password,
          organizationName: data.organizationName,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(
          'Registration failed',
          result.message || 'Please try again',
        );
        return;
      }

      if (result?.data?.waitlistMode) {
        trackAuthEvent('SIGNUP_COMPLETED', { email, waitlistMode: true });
        await onSuccess({ waitlistMode: true });
        return;
      }

      toast.success('Account created', 'Signing you in...');

      const loginResponse = await fetch(buildApiUrl(API_ROUTES.AUTH.LOGIN), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: data.password,
        }),
      });

      const loginResult = await loginResponse.json();

      if (!loginResponse.ok) {
        toast.info('Account created', 'Please sign in with your credentials');
        return;
      }

      const loginData: LoginResponse = loginResult.data;
      await onSuccess({
        waitlistMode: false,
        accessToken: loginData.accessToken,
        refreshToken: loginData.refreshToken,
      });
      trackAuthEvent('SIGNUP_COMPLETED', { email });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong';
      toast.error('Registration failed', message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid gap-2">
        <Label>Email</Label>
        <div className="flex items-center gap-2 rounded-md border bg-muted px-3 py-2 text-sm">
          {email}
          <CheckCircleIcon className="ml-auto h-4 w-4 text-green-600 dark:text-green-400" />
          <span className="text-xs text-green-600 dark:text-green-400">
            Verified
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="firstName">First name</Label>
          <Input id="firstName" placeholder="Jane" {...register('firstName')} />
          {errors.firstName && (
            <p className="text-sm text-red-500">{errors.firstName.message}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="lastName">Last name</Label>
          <Input id="lastName" placeholder="Smith" {...register('lastName')} />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="organizationName">Agency name</Label>
        <Input
          id="organizationName"
          placeholder="e.g. Northwind Recruitment"
          {...register('organizationName')}
        />
        {errors.organizationName && (
          <p className="text-sm text-red-500">
            {errors.organizationName.message}
          </p>
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
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            className="pr-10"
            {...register('confirmPassword')}
          />
          <button
            type="button"
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
        {isSubmitting ? 'Creating account...' : 'Create account'}
      </Button>

      <div className="text-sm text-center text-muted-foreground">
        Already have an account?{' '}
        <Link
          href="/"
          className="underline underline-offset-4 hover:text-primary"
        >
          Sign in
        </Link>
      </div>
    </form>
  );
}

function ContextStep({
  onSuccess,
  askAgencyName,
}: {
  onSuccess: () => void;
  askAgencyName: boolean;
}) {
  const { trackAuthEvent } = useAnalytics();
  const { organization } = useSession();
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupContextFormData>({
    resolver: zodResolver(signupContextSchema),
    defaultValues: {
      organizationName: askAgencyName ? (organization?.name ?? '') : undefined,
      phoneCountryCode: 'GB',
      phone: '',
    },
  });

  const phoneCountryCode = watch('phoneCountryCode') || 'GB';
  const phoneCode = PHONE_CODES[phoneCountryCode] || '';

  const onSubmit = async (data: SignupContextFormData) => {
    const phone = data.phone?.trim();
    try {
      await fetchApi(API_ROUTES.AUTH.ONBOARDING_CONTEXT, {
        method: 'POST',
        body: JSON.stringify({
          agencySize: data.agencySize,
          ...(askAgencyName && data.organizationName
            ? { organizationName: data.organizationName }
            : {}),
          ...(phone ? { phone, phoneCountryCode: data.phoneCountryCode } : {}),
        }),
      });
      trackAuthEvent('SIGNUP_CONTEXT_COMPLETED', {
        agencySize: data.agencySize,
      });
      onSuccess();
    } catch (err) {
      toast.error(
        'Could not save your details',
        err instanceof Error ? err.message : 'Please try again',
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
      {askAgencyName && (
        <div className="grid gap-2">
          <Label htmlFor="organizationName">Agency name</Label>
          <Input
            id="organizationName"
            placeholder="e.g. Northwind Recruitment"
            {...register('organizationName')}
          />
          {errors.organizationName && (
            <p className="text-sm text-red-500">
              {errors.organizationName.message}
            </p>
          )}
        </div>
      )}

      <div className="grid gap-2">
        <Label>How many people work at your agency?</Label>
        <Controller
          name="agencySize"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {AGENCY_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => field.onChange(size)}
                  className={cn(
                    'rounded-md border px-3 py-2 text-sm font-medium transition-all',
                    field.value === size
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:border-primary/50',
                  )}
                >
                  {AGENCY_SIZE_LABELS[size]}
                </button>
              ))}
            </div>
          )}
        />
        {errors.agencySize && (
          <p className="text-sm text-red-500">{errors.agencySize.message}</p>
        )}
      </div>

      <div className="grid gap-3">
        <div className="grid gap-2">
          <Label htmlFor="phoneCountryCode">Country</Label>
          <Controller
            name="phoneCountryCode"
            control={control}
            render={({ field }) => (
              <CountryCombobox
                value={field.value}
                onValueChange={field.onChange}
              />
            )}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="grid gap-2">
            <Label htmlFor="phoneCode">Code</Label>
            <Input
              id="phoneCode"
              value={phoneCode}
              disabled
              className="bg-muted"
            />
          </div>
          <div className="col-span-2 grid gap-2">
            <Label htmlFor="phone">Phone number (optional)</Label>
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <PhoneInput
                  id="phone"
                  countryCode={phoneCountryCode}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
          </div>
        </div>
        {errors.phone && (
          <p className="text-sm text-red-500">{errors.phone.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Add a number if you would like help setting up
        </p>
      </div>

      <Button className="w-full" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Continue'}
      </Button>
    </form>
  );
}

function WelcomeStep({ onContinue }: { onContinue: (href: string) => void }) {
  const { data: billing } = useBillingSummary();
  const [intent] = useState(readPlanIntent);
  const upgradeHref =
    intent.plan && billing?.configured ? choosePlanHref(intent) : null;
  const planName = intent.plan ? PLANS[intent.plan].name : null;

  return (
    <div className="grid gap-6 text-center">
      <div className="flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
      </div>

      <div className="grid gap-2">
        <h3 className="text-lg font-semibold">Your workspace is ready</h3>
        <p className="text-sm text-muted-foreground">
          {upgradeHref
            ? `You are on the Free plan. Start your ${planName} trial next`
            : 'You are on the Free plan, upgrade any time from Billing'}
        </p>
      </div>

      <div className="grid gap-2">
        {upgradeHref ? (
          <>
            <Button className="w-full" onClick={() => onContinue(upgradeHref)}>
              {`Continue to ${planName}`}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                clearPlanIntent();
                onContinue('/dashboard');
              }}
            >
              Stay on Free
            </Button>
          </>
        ) : (
          <Button className="w-full" onClick={() => onContinue('/dashboard')}>
            Go to dashboard
          </Button>
        )}
      </div>
    </div>
  );
}

function WaitlistThanksStep({ onDone }: { onDone: () => void }) {
  return (
    <div className="grid gap-6 text-center">
      <div className="flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
      </div>

      <div className="grid gap-2">
        <h3 className="text-lg font-semibold">
          Thanks for signing up with RabbitHR!
        </h3>
        <p className="text-sm text-muted-foreground">
          We&apos;ve got your details and a member of our team will reach out to
          you soon to get you set up.
        </p>
      </div>

      <Button className="w-full" onClick={onDone}>
        Back to home
      </Button>
    </div>
  );
}
