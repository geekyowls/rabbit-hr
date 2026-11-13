'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import {
  getLowestPlanWithFeature,
  type PlanFeature,
} from '@boilerplate/shared';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { BILLING_SETTINGS_PATH } from './billing-links';

export function UpgradeHint({
  feature,
  className,
  asLink = true,
}: {
  feature: PlanFeature;
  className?: string;
  asLink?: boolean;
}) {
  const { hasPermission } = usePermissions();
  const plan = getLowestPlanWithFeature(feature);
  const classes = cn(
    'inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400',
    className,
  );

  const canUpgrade = hasPermission(PERMISSIONS_ENUM.BILLING_MANAGE);
  const label = canUpgrade
    ? `Upgrade to ${plan.name}`
    : `Available on ${plan.name}`;

  if (!canUpgrade || !asLink) {
    return (
      <span className={classes}>
        <Sparkles className="size-3.5" />
        {label}
      </span>
    );
  }

  return (
    <Link
      href={BILLING_SETTINGS_PATH}
      className={cn(classes, 'hover:underline')}
    >
      <Sparkles className="size-3.5" />
      {label}
    </Link>
  );
}
