'use client';

import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  FileSignature,
  Link2Off,
  XCircle,
} from 'lucide-react';
import { zodResolver } from '@/lib/zod-resolver';
import { formatDateLong, formatDateTime, formatPayRate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { InitialsAvatar } from '@/components/ui/initials-avatar';
import { EMPLOYMENT_TYPE_LABEL } from '@/components/jobs/job-utils';
import {
  useAcceptOfferSigningMutation,
  useDeclineOfferSigningMutation,
  useOfferSigningQuery,
} from '@/hooks/queries';
import { ApiError } from '@/utils/error-class';
import type { PublicOfferSigning } from '@/types/offer.type';

const acceptSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Type your full name')
    .max(200, 'Name is too long'),
  consent: z.boolean().refine((v) => v, 'Tick the box to sign electronically'),
});

type AcceptFormData = z.infer<typeof acceptSchema>;

const declineSchema = z.object({
  reason: z.string().trim().max(1000, 'Keep the reason under 1000 characters'),
});

type DeclineFormData = z.infer<typeof declineSchema>;

function statusCode(error: unknown) {
  return error instanceof ApiError ? error.statusCode : null;
}

function friendlyError(error: unknown) {
  const code = statusCode(error);
  if (code === 404) return 'This signing link is invalid or has expired';
  if (code === 409) {
    return error instanceof Error && error.message
      ? error.message
      : 'This offer can no longer be signed';
  }
  if (code === 429) return 'Too many attempts, wait a minute and try again';
  if (error instanceof Error && error.message) return error.message;
  return 'Something went wrong, try again';
}

function Shell({
  view,
  embedded,
  children,
}: {
  view?: PublicOfferSigning;
  embedded?: boolean;
  children: ReactNode;
}) {
  if (embedded) return <>{children}</>;
  const company = view?.company;
  return (
    <div className="flex min-h-screen flex-col bg-muted/30 text-foreground dark:bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-4 px-4 sm:px-6">
          {company?.name ? (
            <div className="flex min-w-0 items-center gap-3">
              {company.logo ? (
                <img
                  src={company.logo}
                  alt={company.name}
                  className="h-9 w-9 shrink-0 rounded-lg object-contain"
                />
              ) : (
                <InitialsAvatar
                  name={company.name}
                  className="h-9 w-9 shrink-0 rounded-lg text-sm"
                />
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{company.name}</p>
                <p className="text-xs text-muted-foreground">
                  Offer of employment
                </p>
              </div>
            </div>
          ) : (
            <span className="text-sm font-semibold">Offer of employment</span>
          )}
          {company?.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              Website
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
      <footer className="border-t border-border bg-background">
        <div className="mx-auto max-w-3xl px-4 py-4 text-xs text-muted-foreground sm:px-6">
          Powered by RabbitHR
        </div>
      </footer>
    </div>
  );
}

function StateCard({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-6 py-10 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        {icon}
      </div>
      <h1 className="text-lg font-semibold">{title}</h1>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        {description}
      </p>
      {children}
    </div>
  );
}

function OfferSummary({ view }: { view: PublicOfferSigning }) {
  const settings = { locale: view.locale, timezone: view.timezone };
  const salary =
    view.salaryAmount !== null
      ? formatPayRate(
          view.salaryAmount,
          view.salaryPeriod,
          view.currency,
          view.locale,
        )
      : view.salaryFormatted;
  const items: [string, string | null][] = [
    ['Salary', salary],
    ['Bonus', view.bonus],
    ['Equity', view.equity],
    [
      'Start date',
      view.startDate ? formatDateLong(view.startDate, settings) : null,
    ],
    ['Location', view.location ?? view.job.location],
    [
      'Employment type',
      view.employmentType ? EMPLOYMENT_TYPE_LABEL[view.employmentType] : null,
    ],
    [
      'Respond by',
      view.offerExpiresAt
        ? formatDateLong(view.offerExpiresAt, settings)
        : null,
    ],
  ];
  const shown = items.filter((item): item is [string, string] => !!item[1]);

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {view.client?.name ?? view.company.name}
      </p>
      <h1 className="mt-1 text-xl font-semibold">{view.title}</h1>
      <p className="text-sm text-muted-foreground">
        {view.job.title === view.title
          ? view.job.reference
          : `${view.job.title} · ${view.job.reference}`}
      </p>
      {shown.length > 0 && (
        <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 border-t border-border pt-4 text-sm sm:grid-cols-2">
          {shown.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="font-medium tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

function Letter({ view }: { view: PublicOfferSigning }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-3 text-base font-semibold">Offer letter</h2>
      <div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/90">
        {view.letterBody}
      </div>
    </section>
  );
}

function DeclineForm({
  token,
  onCancel,
  onError,
}: {
  token: string;
  onCancel: () => void;
  onError: (error: unknown) => void;
}) {
  const decline = useDeclineOfferSigningMutation();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DeclineFormData>({
    resolver: zodResolver(declineSchema),
    defaultValues: { reason: '' },
  });

  const submit = handleSubmit(async ({ reason }) => {
    try {
      await decline.mutateAsync({
        token,
        data: reason ? { reason } : {},
      });
    } catch (err) {
      onError(err);
    }
  });

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="decline-reason">Reason (optional)</Label>
        <Textarea
          id="decline-reason"
          rows={3}
          placeholder="Let the team know why, if you would like to"
          {...register('reason')}
        />
        {errors.reason && (
          <p className="text-xs text-destructive">{errors.reason.message}</p>
        )}
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Back
        </Button>
        <Button type="submit" variant="destructive" disabled={isSubmitting}>
          {isSubmitting ? 'Declining...' : 'Decline offer'}
        </Button>
      </div>
    </form>
  );
}

function SignPanel({
  token,
  view,
  onConflict,
}: {
  token: string;
  view: PublicOfferSigning;
  onConflict: () => void;
}) {
  const accept = useAcceptOfferSigningMutation();
  const [declining, setDeclining] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fullName = `${view.candidate.firstName} ${view.candidate.lastName}`;
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AcceptFormData>({
    resolver: zodResolver(acceptSchema),
    defaultValues: { fullName: '', consent: false },
  });
  const consent = watch('consent');

  const handleError = (err: unknown) => {
    const code = statusCode(err);
    if (code === 409 || code === 404) onConflict();
    setFormError(friendlyError(err));
  };

  const submit = handleSubmit(async (data) => {
    setFormError(null);
    try {
      await accept.mutateAsync({
        token,
        data: { fullName: data.fullName, consent: data.consent },
      });
    } catch (err) {
      handleError(err);
    }
  });

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="mb-1 flex items-center gap-2">
        <FileSignature className="h-4 w-4 text-[#3F6650] dark:text-[#8FBFA1]" />
        <h2 className="text-base font-semibold">
          {declining ? 'Decline this offer' : 'Accept and sign'}
        </h2>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        {declining
          ? 'The hiring team will be told that you declined.'
          : `Sign by typing your full name, ${fullName}, exactly as it appears on the offer.`}
      </p>

      {formError && (
        <p
          role="alert"
          className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400"
        >
          {formError}
        </p>
      )}

      {declining ? (
        <DeclineForm
          token={token}
          onCancel={() => {
            setFormError(null);
            setDeclining(false);
          }}
          onError={handleError}
        />
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="sign-name">Full name</Label>
            <Input
              id="sign-name"
              autoComplete="name"
              placeholder={fullName}
              className="h-11 font-serif text-lg italic"
              {...register('fullName')}
            />
            {errors.fullName && (
              <p className="text-xs text-destructive">
                {errors.fullName.message}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <label className="flex items-start gap-2.5 text-sm">
              <Checkbox
                className="mt-0.5"
                checked={consent}
                onCheckedChange={(v) =>
                  setValue('consent', v === true, { shouldValidate: true })
                }
              />
              <span>
                I agree that typing my name is my electronic signature and that
                I accept this offer on the terms in the letter above.
              </span>
            </label>
            {errors.consent && (
              <p className="pl-6 text-xs text-destructive">
                {errors.consent.message}
              </p>
            )}
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setFormError(null);
                setDeclining(true);
              }}
            >
              Decline offer
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <FileSignature className="mr-1.5 h-4 w-4" />
              {isSubmitting ? 'Signing...' : 'Accept and sign'}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}

function Outcome({ view }: { view: PublicOfferSigning }) {
  const settings = { locale: view.locale, timezone: view.timezone };
  if (view.status === 'signed' || view.status === 'accepted') {
    return (
      <StateCard
        icon={
          <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
        }
        title="Offer accepted"
        description={
          view.signedName && view.signedAt
            ? `Signed by ${view.signedName} on ${formatDateTime(view.signedAt, settings)}. The hiring team has been told and will be in touch about next steps.`
            : 'This offer has been accepted. The hiring team will be in touch about next steps.'
        }
      />
    );
  }
  if (view.status === 'declined') {
    return (
      <StateCard
        icon={<XCircle className="h-6 w-6 text-muted-foreground" />}
        title="Offer declined"
        description="You declined this offer and the hiring team has been told. Thank you for letting them know."
      />
    );
  }
  if (view.status === 'expired') {
    return (
      <StateCard
        icon={<Clock className="h-6 w-6 text-muted-foreground" />}
        title="This offer has expired"
        description="The time to respond has passed. Contact the hiring team if you are still interested."
      />
    );
  }
  return (
    <StateCard
      icon={<Link2Off className="h-6 w-6 text-muted-foreground" />}
      title="This offer is no longer open"
      description="The offer has been closed by the hiring team. Contact them if you have any questions."
    />
  );
}

export function OfferSignView({
  token,
  embedded,
}: {
  token: string | null;
  embedded?: boolean;
}) {
  const { data: view, isLoading, error, refetch } = useOfferSigningQuery(token);

  if (!token) {
    return (
      <Shell embedded={embedded}>
        <StateCard
          icon={<Link2Off className="h-6 w-6 text-muted-foreground" />}
          title="Signing link not found"
          description="This link is incomplete. Open the link from your offer email again."
        />
      </Shell>
    );
  }

  if (isLoading) {
    return (
      <Shell embedded={embedded}>
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </Shell>
    );
  }

  if (error || !view) {
    const notFound = statusCode(error) === 404 || statusCode(error) === 400;
    return (
      <Shell embedded={embedded}>
        <StateCard
          icon={<Link2Off className="h-6 w-6 text-muted-foreground" />}
          title={
            notFound
              ? 'This link is invalid or has expired'
              : 'Could not load the offer'
          }
          description={
            notFound
              ? 'Check that you opened the latest link from your offer email, or contact the hiring team.'
              : 'Check your connection and try again.'
          }
        >
          {!notFound && (
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => refetch()}
            >
              Try again
            </Button>
          )}
        </StateCard>
      </Shell>
    );
  }

  const open = view.status === 'pending' && view.canRespond;

  return (
    <Shell view={view} embedded={embedded}>
      <div className="space-y-4">
        {!open && <Outcome view={view} />}
        <OfferSummary view={view} />
        <Letter view={view} />
        {open && (
          <SignPanel token={token} view={view} onConflict={() => refetch()} />
        )}
        {open && (
          <p className="text-center text-xs text-muted-foreground">
            {`This signing link expires on ${formatDateLong(view.linkExpiresAt, { locale: view.locale, timezone: view.timezone })}`}
          </p>
        )}
      </div>
    </Shell>
  );
}
