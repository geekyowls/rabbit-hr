'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { PlugZap } from 'lucide-react';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';
import { usePermissions } from '@/hooks/use-permissions';
import {
  hasIntegrationCapability,
  useIntegrationCapabilities,
} from '@/hooks/queries/use-integration-capabilities-query';
import type { IntegrationCapabilityKey } from '@/types/integration-capabilities.type';
import { cn } from '@/lib/utils';
import { usePlanFeature } from '@/hooks/queries/use-billing-query';
import { UpgradeHint } from '@/components/billing/upgrade-hint';
import { CAPABILITY_PLAN_FEATURES } from '@/components/billing/capability-plan-features';

const INTEGRATIONS_SETTINGS_PATH = '/dashboard/settings/integrations';

interface IfIntegrationProps {
  capability: IntegrationCapabilityKey;
  children: ReactNode;
  fallback?: ReactNode;
  adminHint?: boolean | string;
  className?: string;
}

export function IfIntegration({
  capability,
  children,
  fallback = null,
  adminHint = false,
  className,
}: IfIntegrationProps) {
  const { data, isLoading } = useIntegrationCapabilities();
  const { hasPermission } = usePermissions();
  const planFeature = CAPABILITY_PLAN_FEATURES[capability];
  const { hasFeature } = usePlanFeature(planFeature);

  if (isLoading) return null;
  if (hasIntegrationCapability(data, capability)) return <>{children}</>;

  if (adminHint && !hasFeature && planFeature) {
    return <UpgradeHint feature={planFeature} className={className} />;
  }

  if (adminHint && hasPermission(PERMISSIONS_ENUM.INTEGRATION_CONNECT)) {
    return (
      <Link
        href={INTEGRATIONS_SETTINGS_PATH}
        className={cn(
          'inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:underline',
          className,
        )}
      >
        <PlugZap className="size-3.5" />
        {typeof adminHint === 'string' ? adminHint : 'Connect in Settings'}
      </Link>
    );
  }

  return <>{fallback}</>;
}
