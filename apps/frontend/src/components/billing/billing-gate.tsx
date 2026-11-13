'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AlertTriangle, Lock } from 'lucide-react';
import { BillingAccess, getPlan } from '@boilerplate/shared';
import { useBillingSummary } from '@/hooks/queries';
import { Button } from '@/components/ui/button';
import { BILLING_SETTINGS_PATH, CHOOSE_PLAN_PATH } from './billing-links';

const BILLING_PATHS = ['/dashboard/billing', BILLING_SETTINGS_PATH];

function planName(planId: string | null): string {
  return getPlan(planId)?.name ?? 'current';
}

export function BillingGate() {
  const { data } = useBillingSummary();
  const pathname = usePathname();
  const router = useRouter();
  const onBillingPage = BILLING_PATHS.some((path) => pathname.startsWith(path));
  const needsPlan =
    !!data?.enforced && data.access === BillingAccess.NEEDS_PLAN;

  useEffect(() => {
    if (needsPlan && !onBillingPage) router.replace(CHOOSE_PLAN_PATH);
  }, [needsPlan, onBillingPage, router]);

  if (data?.enforced && data.overLimit && data.access === BillingAccess.FULL) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 shrink-0" />
          <span>
            {`You are over the ${planName(data.effectivePlan)} plan limits, so you cannot add more members or active jobs`}
          </span>
        </div>
        {!onBillingPage && (
          <Button size="sm" variant="outline" className="h-7" asChild>
            <Link href={BILLING_SETTINGS_PATH}>Upgrade</Link>
          </Button>
        )}
      </div>
    );
  }

  if (!data?.enforced || data.access !== BillingAccess.READ_ONLY) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
      <div className="flex items-center gap-2">
        <Lock className="size-4 shrink-0" />
        <span>
          Your subscription is inactive, so RabbitHR is read only until you
          renew
        </span>
      </div>
      {!onBillingPage && (
        <Button size="sm" variant="outline" className="h-7" asChild>
          <Link href={BILLING_SETTINGS_PATH}>Go to billing</Link>
        </Button>
      )}
    </div>
  );
}
