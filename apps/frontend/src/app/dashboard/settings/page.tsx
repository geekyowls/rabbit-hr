'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  Users,
  ShieldCheck,
  ClipboardList,
  Plug2,
  Building2,
  Mail,
  Globe2,
  Workflow,
  ListPlus,
  CalendarClock,
  CreditCard,
} from 'lucide-react';
import { PlanFeature } from '@boilerplate/shared';
import { usePermissions } from '@/hooks/use-permissions';
import {
  PERMISSIONS_ENUM,
  PERMISSION_BASE,
} from '@/constants/permissions.constants';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { SettingsPageSkeleton } from '@/components/skeletons';
import { useBillingSummary } from '@/hooks/queries';
import { UpgradeHint } from '@/components/billing/upgrade-hint';
import { BILLING_SETTINGS_PATH } from '@/components/billing/billing-links';

interface SettingsCard {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string | string[];
  tourId: string;
  feature?: PlanFeature;
  lockedWithoutFeature?: boolean;
}

const settingsCards: SettingsCard[] = [
  {
    href: '/dashboard/settings/organization',
    title: 'Organization',
    description: 'Manage organization name, logo and contact info',
    icon: Building2,
    permission: PERMISSIONS_ENUM.ORGANIZATION_READ,
    tourId: 'settings-organization',
  },
  {
    href: '/dashboard/settings/ats',
    title: 'Hiring preferences',
    description: 'Currency, region, date format and departments',
    icon: Globe2,
    permission: PERMISSIONS_ENUM.ATS_SETTINGS_MANAGE,
    tourId: 'settings-ats',
  },
  {
    href: '/dashboard/settings/pipeline',
    title: 'Pipeline stages',
    description: 'Stages, order and colours of your hiring pipeline',
    icon: Workflow,
    permission: PERMISSIONS_ENUM.PIPELINE_STAGE_MANAGE,
    tourId: 'settings-pipeline',
  },
  {
    href: '/dashboard/settings/custom-fields',
    title: 'Custom fields',
    description: 'Extra fields on candidates, jobs and the careers form',
    icon: ListPlus,
    permission: PERMISSIONS_ENUM.CUSTOM_FIELD_MANAGE,
    tourId: 'settings-custom-fields',
    feature: PlanFeature.CUSTOM_FIELDS,
    lockedWithoutFeature: true,
  },
  {
    href: '/dashboard/settings/email-templates',
    title: 'Email templates',
    description: 'Reusable candidate emails with merge fields',
    icon: Mail,
    permission: PERMISSIONS_ENUM.EMAIL_TEMPLATE_READ,
    tourId: 'settings-email-templates',
  },
  {
    href: '/dashboard/settings/integrations',
    title: 'Integrations',
    description: 'Connect third-party services',
    icon: Plug2,
    permission: PERMISSIONS_ENUM.INTEGRATION_LIST_READ,
    tourId: 'settings-integrations',
  },
  {
    href: '/dashboard/settings/availability',
    title: 'My availability',
    description: 'Working hours, time off and interview booking rules',
    icon: CalendarClock,
    tourId: 'settings-availability',
  },
  {
    href: '/dashboard/settings/users',
    title: 'Users',
    description: 'Manage team members and invitations',
    icon: Users,
    permission: PERMISSION_BASE.USER_LIST_READ,
    tourId: 'settings-users',
  },
  {
    href: '/dashboard/settings/roles',
    title: 'Roles',
    description: 'Configure roles and permissions',
    icon: ShieldCheck,
    permission: PERMISSIONS_ENUM.ROLE_LIST_READ,
    tourId: 'settings-roles',
    feature: PlanFeature.CUSTOM_ROLES,
  },
  {
    href: '/dashboard/settings/audit',
    title: 'Audit log',
    description: 'Every change made in your organization',
    icon: ClipboardList,
    permission: PERMISSIONS_ENUM.AUDIT_LIST_READ,
    tourId: 'settings-audit',
    feature: PlanFeature.AUDIT_LOG,
    lockedWithoutFeature: true,
  },
  {
    href: BILLING_SETTINGS_PATH,
    title: 'Billing',
    description: 'Plan, team member limit and invoices',
    icon: CreditCard,
    permission: PERMISSIONS_ENUM.BILLING_MANAGE,
    tourId: 'settings-billing',
  },
  {
    href: '/dashboard/settings/general',
    title: 'My account',
    description: 'Your profile and password',
    icon: User,
    tourId: 'settings-general',
  },
];

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const { hasAnyPermission } = usePermissions();
  const { data: billing } = useBillingSummary();
  const lacksFeature = (feature?: PlanFeature) =>
    !!feature && !!billing?.enforced && !billing.features.includes(feature);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <SettingsPageSkeleton />;
  }

  const visibleCards = settingsCards.filter((card) => {
    if (!card.permission) return true;
    const perms = Array.isArray(card.permission)
      ? card.permission
      : [card.permission];
    return hasAnyPermission(perms);
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {visibleCards.map((card) => {
        const locked = lacksFeature(card.feature);
        return (
          <Link
            key={card.href}
            href={
              locked && card.lockedWithoutFeature
                ? BILLING_SETTINGS_PATH
                : card.href
            }
          >
            <Card
              className="h-full transition-colors hover:bg-muted/50"
              data-tour={card.tourId}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <card.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{card.title}</CardTitle>
                    <CardDescription>{card.description}</CardDescription>
                    {locked && card.feature && (
                      <UpgradeHint
                        feature={card.feature}
                        asLink={false}
                        className="mt-1"
                      />
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
