'use client';

import type { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import {
  getLowestPlanWithFeature,
  PLAN_FEATURE_LABELS,
  type PlanFeature,
} from '@boilerplate/shared';
import { usePlanFeature } from '@/hooks/queries/use-billing-query';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/patterns';
import { UpgradeHint } from './upgrade-hint';

export function PlanFeatureGate({
  feature,
  children,
}: {
  feature: PlanFeature;
  children: ReactNode;
}) {
  const { hasFeature, isLoading } = usePlanFeature(feature);
  if (isLoading) return null;
  if (hasFeature) return <>{children}</>;
  const plan = getLowestPlanWithFeature(feature);
  return (
    <Card>
      <EmptyState
        icon={<Sparkles className="size-6" />}
        title={`${PLAN_FEATURE_LABELS[feature]} is on the ${plan.name} plan`}
        description={`Upgrade to ${plan.name} to unlock it for your whole team`}
        action={<UpgradeHint feature={feature} />}
      />
    </Card>
  );
}
