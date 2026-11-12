'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Briefcase, Check, Laptop, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { browserLocale, formatJobPay } from '@/lib/format';
import {
  usePortalApplicationQuery,
  usePortalApplicationsQuery,
  useWithdrawPortalApplicationMutation,
} from '@/hooks/queries';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EmptyState } from '@/components/patterns';
import {
  EMPLOYMENT_TYPE_LABEL,
  WORK_MODE_LABEL,
} from '@/components/careers/careers-utils';
import { usePortalSession } from '@/components/portal/portal-session';
import {
  ApplicationItem,
  BookingLinkItem,
  InterviewItem,
  OfferItem,
  PortalCard,
  PortalList,
  PortalStatusPill,
} from '@/components/portal/portal-items';
import { portalDate } from '@/components/portal/portal-utils';
import type {
  PortalApplicationDetail,
  PortalTimelineStep,
} from '@/types/portal.type';

function ProgressTimeline({
  steps,
  brand,
}: {
  steps: PortalTimelineStep[];
  brand: string;
}) {
  return (
    <ol className="space-y-0">
      {steps.map((step, index) => {
        const last = index === steps.length - 1;
        const reached = step.state !== 'upcoming';
        return (
          <li key={`${step.status}-${index}`} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-white',
                  !reached && 'border-border bg-background',
                )}
                style={
                  reached
                    ? { backgroundColor: brand, borderColor: brand }
                    : undefined
                }
              >
                {step.state === 'done' && <Check className="h-3.5 w-3.5" />}
                {step.state === 'current' && (
                  <span className="h-2 w-2 rounded-full bg-white" />
                )}
              </span>
              {!last && (
                <span
                  className={cn(
                    'my-1 w-0.5 flex-1',
                    step.state !== 'done' && 'bg-border',
                  )}
                  style={
                    step.state === 'done'
                      ? { backgroundColor: brand }
                      : undefined
                  }
                />
              )}
            </div>
            <div className={cn('min-w-0', !last && 'pb-5')}>
              <p
                className={cn(
                  'text-sm',
                  step.state === 'current' ? 'font-semibold' : 'font-medium',
                  !reached && 'text-muted-foreground',
                )}
              >
                {step.label}
              </p>
              {step.reachedAt && (
                <p className="text-xs text-muted-foreground">
                  {portalDate(step.reachedAt)}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function WithdrawDialog({
  application,
  open,
  onOpenChange,
}: {
  application: PortalApplicationDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const withdraw = useWithdrawPortalApplicationMutation();
  const [reason, setReason] = useState('');

  const confirm = async () => {
    try {
      await withdraw.mutateAsync({ id: application.id, reason: reason.trim() });
      toast.success('Application withdrawn');
      onOpenChange(false);
    } catch (err) {
      toast.error(
        'Could not withdraw',
        err instanceof Error ? err.message : undefined,
      );
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Withdraw your application</AlertDialogTitle>
          <AlertDialogDescription>
            You will be removed from the {application.jobTitle} process. This
            cannot be undone, but you can apply for other roles at any time.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="withdraw-reason">Reason (optional)</Label>
          <Textarea
            id="withdraw-reason"
            rows={3}
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Let the team know why, if you like"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={withdraw.isPending}>
            Keep application
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={confirm}
            disabled={withdraw.isPending}
          >
            {withdraw.isPending ? 'Withdrawing...' : 'Withdraw'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ApplicationDetail({ id }: { id: string }) {
  const { brand } = usePortalSession();
  const { data, isLoading, error } = usePortalApplicationQuery(id);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const back = (
    <Link
      href="/portal/applications"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      All applications
    </Link>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {back}
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="space-y-4">
        {back}
        <div className="rounded-xl border border-border bg-card">
          <EmptyState
            title="Application not found"
            description="It may have been removed. Go back to see all your applications"
          />
        </div>
      </div>
    );
  }

  const pay = formatJobPay(data, browserLocale());

  return (
    <div className="space-y-4">
      {back}
      <PortalCard>
        <div className="space-y-3 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {data.jobReference}
              </p>
              <h1 className="text-xl font-semibold tracking-tight">
                {data.jobTitle}
              </h1>
            </div>
            <PortalStatusPill application={data} />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {data.jobLocation && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {data.jobLocation}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Laptop className="h-3.5 w-3.5" />
              {WORK_MODE_LABEL[data.workMode]}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5" />
              {EMPLOYMENT_TYPE_LABEL[data.employmentType]}
            </span>
            {pay !== 'Not set' && (
              <span className="font-medium text-foreground">{pay}</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Applied {portalDate(data.appliedAt)}
          </p>
        </div>
      </PortalCard>

      <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
        <div className="space-y-4">
          {data.offers.length > 0 && (
            <PortalCard title="Offer">
              <PortalList>
                {data.offers.map((offer) => (
                  <OfferItem key={offer.id} offer={offer} />
                ))}
              </PortalList>
            </PortalCard>
          )}
          {(data.interviews.length > 0 || data.bookingLinks.length > 0) && (
            <PortalCard title="Interviews">
              <PortalList>
                {data.bookingLinks.map((link) => (
                  <BookingLinkItem key={link.id} link={link} />
                ))}
                {data.interviews.map((interview) => (
                  <InterviewItem
                    key={interview.id}
                    interview={interview}
                    brand={brand}
                  />
                ))}
              </PortalList>
            </PortalCard>
          )}
          {data.description?.trim() && (
            <PortalCard title="About the role">
              <div className="whitespace-pre-wrap break-words p-4 text-sm leading-relaxed text-muted-foreground">
                {data.description}
              </div>
            </PortalCard>
          )}
        </div>
        <div className="space-y-4">
          <PortalCard title="Progress">
            <div className="p-4">
              <ProgressTimeline steps={data.timeline} brand={brand} />
            </div>
          </PortalCard>
          {data.canWithdraw && (
            <Button
              variant="outline"
              className="w-full text-red-600 hover:text-red-700 dark:text-red-400"
              onClick={() => setWithdrawOpen(true)}
            >
              Withdraw application
            </Button>
          )}
        </div>
      </div>
      <WithdrawDialog
        application={data}
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
      />
    </div>
  );
}

function ApplicationsList() {
  const { data, isLoading } = usePortalApplicationsQuery();
  const open = (data ?? []).filter((a) => !a.isClosed);
  const closed = (data ?? []).filter((a) => a.isClosed);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Applications
          </h1>
          <p className="text-sm text-muted-foreground">
            Follow each application from start to finish
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/portal/jobs">Browse roles</Link>
        </Button>
      </div>
      {isLoading ? (
        <Skeleton className="h-48 w-full rounded-xl" />
      ) : !data?.length ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState
            icon={<Briefcase className="h-8 w-8" />}
            title="No applications yet"
            description="Browse open roles and apply to see them here"
          />
        </div>
      ) : (
        <>
          <PortalCard title="Active">
            {open.length ? (
              <PortalList>
                {open.map((application) => (
                  <ApplicationItem
                    key={application.id}
                    application={application}
                  />
                ))}
              </PortalList>
            ) : (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                No active applications
              </p>
            )}
          </PortalCard>
          {closed.length > 0 && (
            <PortalCard title="Closed">
              <PortalList>
                {closed.map((application) => (
                  <ApplicationItem
                    key={application.id}
                    application={application}
                  />
                ))}
              </PortalList>
            </PortalCard>
          )}
        </>
      )}
    </div>
  );
}

function ApplicationsContent() {
  const id = useSearchParams().get('id');
  return id ? <ApplicationDetail id={id} /> : <ApplicationsList />;
}

export default function PortalApplicationsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-48 w-full rounded-xl" />}>
      <ApplicationsContent />
    </Suspense>
  );
}
