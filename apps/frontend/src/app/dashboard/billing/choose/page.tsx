'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  BillingAccess,
  BillingInterval,
  PlanId,
  TRIAL_PERIOD_DAYS,
} from '@boilerplate/shared';
import { toast } from '@/lib/toast';
import { useBreadcrumb } from '@/contexts/breadcrumb-context';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';
import { usePermissions } from '@/hooks/use-permissions';
import { useBillingSummary, useCheckoutMutation } from '@/hooks/queries';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/patterns';
import { IntervalToggle, PlanPicker } from '@/components/billing/plan-picker';
import {
  BILLING_SETTINGS_PATH,
  parsePlanIntent,
  readPlanIntent,
} from '@/components/billing/billing-links';
import type { CheckoutOption } from '@/types/billing.type';

function ChoosePlanContent() {
  useBreadcrumb([{ label: 'Choose a plan', active: true }]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();
  const { data, isLoading } = useBillingSummary();
  const checkout = useCheckoutMutation();
  const [pendingPlan, setPendingPlan] = useState<PlanId | null>(null);
  const [intent] = useState(() => {
    const fromQuery = parsePlanIntent(
      searchParams.get('plan'),
      searchParams.get('billing'),
    );
    const stored = readPlanIntent();
    return {
      plan: fromQuery.plan ?? stored.plan ?? PlanId.GROWTH,
      interval: fromQuery.interval ?? stored.interval ?? BillingInterval.MONTH,
    };
  });
  const [interval, setInterval] = useState<BillingInterval>(intent.interval);

  useEffect(() => {
    if (data && data.access === BillingAccess.FULL && data.plan) {
      router.replace(BILLING_SETTINGS_PATH);
    }
  }, [data, router]);

  const select = async (option: CheckoutOption) => {
    setPendingPlan(option.plan);
    try {
      const { url } = await checkout.mutateAsync(option);
      window.location.href = url;
    } catch (err) {
      setPendingPlan(null);
      toast.error(
        'Could not start checkout',
        err instanceof Error ? err.message : undefined,
      );
    }
  };

  if (isLoading || !data) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!data.configured) {
    return (
      <EmptyState
        title="Billing is not configured"
        description="This workspace runs without billing, so every feature is available"
      />
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Choose your plan"
        description={
          data.hasCustomer
            ? 'Pick a plan to reactivate your workspace'
            : `Every plan starts with a ${TRIAL_PERIOD_DAYS}-day free trial, cancel any time before it ends`
        }
        actions={<IntervalToggle value={interval} onChange={setInterval} />}
      />
      <PlanPicker
        interval={interval}
        checkoutOptions={data.checkoutOptions}
        currentPlan={data.access === BillingAccess.FULL ? data.plan : null}
        currentInterval={data.billingInterval}
        highlightPlan={intent.plan}
        pendingPlan={pendingPlan}
        actionLabel={data.hasCustomer ? 'Subscribe' : 'Start free trial'}
        canSelect={hasPermission(PERMISSIONS_ENUM.BILLING_MANAGE)}
        onSelect={select}
      />
      <p className="text-xs text-muted-foreground">
        Flat price per organization, not per user. Prices in USD, taxes may
        apply at checkout.
      </p>
    </div>
  );
}

export default function ChoosePlanPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <ChoosePlanContent />
    </Suspense>
  );
}
