'use client';

import { Check } from 'lucide-react';
import {
  BillingInterval,
  PLAN_FEATURE_LABELS,
  PLANS,
  PlanId,
  SELF_SERVE_PLAN_IDS,
  getPlanPrice,
  type PlanDefinition,
} from '@boilerplate/shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SegmentedControl, StatusPill } from '@/components/patterns';
import { cn } from '@/lib/utils';
import type { CheckoutOption } from '@/types/billing.type';
import { CONTACT_SALES_URL } from './billing-links';

const STARTER_HIGHLIGHTS = [
  'Unlimited active jobs, candidates and clients',
  'Shared email inbox',
  'Offer e-signature and candidate portal',
];

const STARTER_FEATURES = PLANS[PlanId.STARTER].features;

function planHighlights(plan: PlanDefinition): string[] {
  const members =
    plan.memberLimit === null
      ? 'Custom team member limit'
      : `Up to ${plan.memberLimit} team members`;
  switch (plan.id) {
    case PlanId.FREE:
      return [members, `Up to ${plan.activeJobLimit} active jobs`];
    case PlanId.STARTER:
      return [members, ...STARTER_HIGHLIGHTS];
    case PlanId.GROWTH:
      return [
        members,
        'Everything in Starter',
        ...plan.features
          .filter((feature) => !STARTER_FEATURES.includes(feature))
          .map((feature) => PLAN_FEATURE_LABELS[feature]),
      ];
    case PlanId.SCALE:
      return [members, 'Everything in Growth'];
    case PlanId.ENTERPRISE:
      return [members, 'Everything in Scale', 'Onboarding and custom terms'];
  }
}

function formatPrice(amount: number): string {
  return `$${amount.toLocaleString('en-US')}`;
}

export function IntervalToggle({
  value,
  onChange,
}: {
  value: BillingInterval;
  onChange: (value: BillingInterval) => void;
}) {
  return (
    <SegmentedControl
      value={value}
      onChange={onChange}
      options={[
        { value: BillingInterval.MONTH, label: 'Monthly' },
        { value: BillingInterval.YEAR, label: 'Yearly, 2 months free' },
      ]}
    />
  );
}

export function PlanPicker({
  interval,
  checkoutOptions,
  currentPlan,
  currentInterval,
  highlightPlan,
  pendingPlan,
  actionLabel,
  canSelect,
  onSelect,
}: {
  interval: BillingInterval;
  checkoutOptions: CheckoutOption[];
  currentPlan?: PlanId | null;
  currentInterval?: BillingInterval | null;
  highlightPlan?: PlanId | null;
  pendingPlan?: PlanId | null;
  actionLabel: string;
  canSelect: boolean;
  onSelect: (option: CheckoutOption) => void;
}) {
  const plans = [...SELF_SERVE_PLAN_IDS, PlanId.ENTERPRISE].map(
    (id) => PLANS[id],
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {plans.map((plan) => {
        const price = getPlanPrice(plan.id, interval);
        const isCurrent =
          plan.id === currentPlan &&
          (plan.id === PlanId.ENTERPRISE || interval === currentInterval);
        const available = checkoutOptions.some(
          (o) => o.plan === plan.id && o.interval === interval,
        );
        const highlighted = plan.id === highlightPlan;
        return (
          <Card
            key={plan.id}
            className={cn(
              'flex flex-col gap-4 p-4',
              highlighted && 'border-primary ring-1 ring-primary',
            )}
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold">{plan.name}</h3>
                {isCurrent && (
                  <StatusPill tone="success" dot>
                    Current
                  </StatusPill>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {plan.description}
              </p>
            </div>
            <div>
              {price === null ? (
                <span className="text-2xl font-semibold">Custom</span>
              ) : (
                <>
                  <span className="text-2xl font-semibold">
                    {formatPrice(price)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {interval === BillingInterval.YEAR ? ' / year' : ' / month'}
                  </span>
                </>
              )}
            </div>
            <ul className="flex-1 space-y-1.5 text-sm">
              {planHighlights(plan).map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-green-600 dark:text-green-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            {isCurrent ? (
              <Button variant="outline" disabled>
                Current plan
              </Button>
            ) : available && canSelect ? (
              <Button
                variant={highlighted ? 'default' : 'outline'}
                disabled={!!pendingPlan}
                onClick={() => onSelect({ plan: plan.id, interval })}
              >
                {pendingPlan === plan.id ? 'Please wait...' : actionLabel}
              </Button>
            ) : available ? (
              <Button variant="outline" disabled>
                Ask an admin to subscribe
              </Button>
            ) : (
              <Button variant="outline" asChild>
                <a href={CONTACT_SALES_URL} target="_blank" rel="noreferrer">
                  Contact us
                </a>
              </Button>
            )}
          </Card>
        );
      })}
    </div>
  );
}
