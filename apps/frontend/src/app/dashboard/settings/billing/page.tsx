'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CreditCard, ExternalLink, Users } from 'lucide-react';
import {
  BillingAccess,
  BillingInterval,
  OrgSubscriptionStatus,
  PLANS,
  PlanId,
} from '@boilerplate/shared';
import { toast } from '@/lib/toast';
import { useBreadcrumb } from '@/contexts/breadcrumb-context';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';
import {
  useBillingSummary,
  useCancelSubscriptionMutation,
  useChangePlanMutation,
  useCheckoutMutation,
  usePortalMutation,
  useResumeSubscriptionMutation,
  useSyncSubscriptionMutation,
} from '@/hooks/queries';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EmptyState, SectionCard, StatusPill } from '@/components/patterns';
import { IntervalToggle, PlanPicker } from '@/components/billing/plan-picker';
import {
  BILLING_SETTINGS_PATH,
  CHOOSE_PLAN_PATH,
} from '@/components/billing/billing-links';
import {
  SUBSCRIPTION_STATUS_LABELS,
  SUBSCRIPTION_STATUS_TONES,
  describeBillingPeriod,
} from '@/components/billing/billing-status';
import type { BillingSummary, CheckoutOption } from '@/types/billing.type';

const LIVE_STATUSES = [
  OrgSubscriptionStatus.ACTIVE,
  OrgSubscriptionStatus.TRIAL,
  OrgSubscriptionStatus.PAST_DUE,
];

function errorMessage(err: unknown): string | undefined {
  return err instanceof Error ? err.message : undefined;
}

function useCheckoutReturnSync() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sync = useSyncSubscriptionMutation();
  const handled = useRef(false);
  const subscriptionId = searchParams.get('subscription_id');

  useEffect(() => {
    if (!subscriptionId || handled.current) return;
    handled.current = true;
    sync
      .mutateAsync(subscriptionId)
      .then(() => toast.success('Subscription updated'))
      .catch((err) =>
        toast.info(
          'Your payment is being confirmed',
          errorMessage(err) ?? 'This page updates once Dodo confirms it',
        ),
      )
      .finally(() => router.replace(BILLING_SETTINGS_PATH));
  }, [subscriptionId, sync, router]);
}

function CurrentPlanCard({ summary }: { summary: BillingSummary }) {
  const portal = usePortalMutation();
  const cancel = useCancelSubscriptionMutation();
  const resume = useResumeSubscriptionMutation();
  const [cancelOpen, setCancelOpen] = useState(false);
  const plan = summary.plan ? PLANS[summary.plan] : null;
  const isLive = LIVE_STATUSES.includes(summary.status);
  const { count, limit } = summary.members;
  const period = describeBillingPeriod(summary);

  const openPortal = async () => {
    try {
      const { url } = await portal.mutateAsync();
      window.open(url, '_blank', 'noopener');
    } catch (err) {
      toast.error('Could not open the billing portal', errorMessage(err));
    }
  };

  const confirmCancel = async () => {
    try {
      await cancel.mutateAsync();
      setCancelOpen(false);
      toast.success('Subscription will cancel at the end of the period');
    } catch (err) {
      toast.error('Could not cancel the subscription', errorMessage(err));
    }
  };

  const keepSubscription = async () => {
    try {
      await resume.mutateAsync();
      toast.success('Subscription will renew as normal');
    } catch (err) {
      toast.error('Could not update the subscription', errorMessage(err));
    }
  };

  return (
    <SectionCard
      icon={CreditCard}
      title="Current plan"
      actions={
        summary.hasCustomer && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            disabled={portal.isPending}
            onClick={openPortal}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Payment method and invoices
          </Button>
        )
      }
      bodyClassName="grid gap-4 p-4 md:grid-cols-2"
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">
            {plan?.name ?? 'No plan'}
          </span>
          {plan && (
            <StatusPill tone={SUBSCRIPTION_STATUS_TONES[summary.status]} dot>
              {SUBSCRIPTION_STATUS_LABELS[summary.status]}
            </StatusPill>
          )}
          {summary.billingInterval && plan?.id !== PlanId.ENTERPRISE && (
            <span className="text-xs text-muted-foreground">
              {summary.billingInterval === BillingInterval.YEAR
                ? 'Billed yearly'
                : 'Billed monthly'}
            </span>
          )}
        </div>
        {period && <p className="text-sm text-muted-foreground">{period}</p>}
        <div className="flex flex-wrap gap-2 pt-2">
          {summary.hasSubscription && isLive && !summary.cancelAtPeriodEnd && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-muted-foreground"
              onClick={() => setCancelOpen(true)}
            >
              Cancel at period end
            </Button>
          )}
          {summary.hasSubscription && isLive && summary.cancelAtPeriodEnd && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              disabled={resume.isPending}
              onClick={keepSubscription}
            >
              Keep subscription
            </Button>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-4 w-4" />
            Team members
          </span>
          <span className="font-medium">
            {limit === null ? count : `${count} of ${limit}`}
          </span>
        </div>
        {limit !== null && (
          <Progress value={Math.min(100, (count / limit) * 100)} />
        )}
        <p className="text-xs text-muted-foreground">
          Invited and active members count toward the limit
        </p>
      </div>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel subscription</AlertDialogTitle>
            <AlertDialogDescription>
              You keep full access until the end of the current period. After
              that RabbitHR becomes read only. Your data is never deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancel.isPending}>
              Keep plan
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancel}
              disabled={cancel.isPending}
            >
              Cancel at period end
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SectionCard>
  );
}

function ChangePlanCard({ summary }: { summary: BillingSummary }) {
  const changePlan = useChangePlanMutation();
  const checkout = useCheckoutMutation();
  const [interval, setInterval] = useState<BillingInterval>(
    summary.billingInterval ?? BillingInterval.MONTH,
  );
  const [pendingPlan, setPendingPlan] = useState<PlanId | null>(null);
  const [confirm, setConfirm] = useState<CheckoutOption | null>(null);
  const canSwitch =
    summary.hasSubscription && LIVE_STATUSES.includes(summary.status);

  const startCheckout = async (option: CheckoutOption) => {
    setPendingPlan(option.plan);
    try {
      const { url } = await checkout.mutateAsync(option);
      window.location.href = url;
    } catch (err) {
      setPendingPlan(null);
      toast.error('Could not start checkout', errorMessage(err));
    }
  };

  const confirmSwitch = async () => {
    if (!confirm) return;
    setPendingPlan(confirm.plan);
    try {
      await changePlan.mutateAsync(confirm);
      toast.success(`Switched to ${PLANS[confirm.plan].name}`);
      setConfirm(null);
    } catch (err) {
      toast.error('Could not change plan', errorMessage(err));
    } finally {
      setPendingPlan(null);
    }
  };

  return (
    <SectionCard
      title={canSwitch ? 'Change plan' : 'Choose a plan'}
      subtitle="Flat price per organization, not per user"
      actions={<IntervalToggle value={interval} onChange={setInterval} />}
      bodyClassName="p-4"
    >
      <PlanPicker
        interval={interval}
        checkoutOptions={summary.checkoutOptions}
        currentPlan={
          summary.access === BillingAccess.FULL ? summary.plan : null
        }
        currentInterval={summary.billingInterval}
        pendingPlan={pendingPlan}
        actionLabel={canSwitch ? 'Switch plan' : 'Subscribe'}
        canSelect
        onSelect={(option) =>
          canSwitch ? setConfirm(option) : startCheckout(option)
        }
      />

      <AlertDialog
        open={!!confirm}
        onOpenChange={(open) => !open && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm ? `Switch to ${PLANS[confirm.plan].name}` : ''}
            </AlertDialogTitle>
            <AlertDialogDescription>
              The change applies now. Your card is charged or credited the
              prorated difference for the rest of this period.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={changePlan.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSwitch}
              disabled={changePlan.isPending}
            >
              Switch plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SectionCard>
  );
}

function BillingContent() {
  useBreadcrumb([
    { label: 'Settings', href: '/dashboard/settings' },
    { label: 'Billing', active: true },
  ]);
  useCheckoutReturnSync();
  const { data, isLoading } = useBillingSummary();

  if (isLoading || !data) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Billing"
        description="Your plan, team member limit and payment details"
        backHref="/dashboard/settings"
      />
      {!data.configured || data.isSystemOrg ? (
        <SectionCard title="Billing" bodyClassName="p-4">
          <EmptyState
            compact
            title={
              data.configured
                ? 'Billing does not apply to this workspace'
                : 'Billing is not configured'
            }
            description="Every feature is available and there is no member limit"
          />
        </SectionCard>
      ) : (
        <>
          {data.plan ? (
            <CurrentPlanCard summary={data} />
          ) : (
            <SectionCard title="No plan yet" bodyClassName="p-4">
              <p className="text-sm text-muted-foreground">
                Choose a plan to start your free trial{' '}
                <Link
                  href={CHOOSE_PLAN_PATH}
                  className="font-medium text-foreground underline"
                >
                  See plans
                </Link>
              </p>
            </SectionCard>
          )}
          {data.plan !== PlanId.ENTERPRISE && <ChangePlanCard summary={data} />}
        </>
      )}
    </div>
  );
}

export default function BillingPage() {
  return (
    <PermissionGuard
      permissions={PERMISSIONS_ENUM.BILLING_MANAGE}
      fallback={
        <EmptyState
          title="Billing is managed by your admin"
          description="Ask an admin to change the plan or payment details"
        />
      }
    >
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <BillingContent />
      </Suspense>
    </PermissionGuard>
  );
}
