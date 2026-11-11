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
} from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { isSystemAdminAccess } from '@/utils/cookies';
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

interface SettingsCard {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string | string[];
  systemAdminOnly?: boolean;
  tourId: string;
}

const settingsCards: SettingsCard[] = [
  {
    href: '/dashboard/settings/general',
    title: 'General',
    description: 'Account information and profile settings',
    icon: User,
    tourId: 'settings-general',
  },
  {
    href: '/dashboard/settings/organization',
    title: 'Organization',
    description: 'Manage organization name, logo and contact info',
    icon: Building2,
    permission: PERMISSIONS_ENUM.ORGANIZATION_READ,
    tourId: 'settings-organization',
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
  },
  {
    href: '/dashboard/settings/audit',
    title: 'Audit Logs',
    description: 'Track all actions in your organization',
    icon: ClipboardList,
    permission: PERMISSIONS_ENUM.AUDIT_LIST_READ,
    systemAdminOnly: true,
    tourId: 'settings-audit',
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
    href: '/dashboard/settings/email-templates',
    title: 'Email templates',
    description: 'Reusable candidate emails with merge fields',
    icon: Mail,
    permission: PERMISSIONS_ENUM.EMAIL_TEMPLATE_READ,
    tourId: 'settings-email-templates',
  },
];

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const { hasAnyPermission } = usePermissions();

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <SettingsPageSkeleton />;
  }

  const inSystemAdminAccess = isSystemAdminAccess();
  const visibleCards = settingsCards.filter((card) => {
    if (card.systemAdminOnly && !inSystemAdminAccess) return false;
    if (!card.permission) return true;
    const perms = Array.isArray(card.permission)
      ? card.permission
      : [card.permission];
    return hasAnyPermission(perms);
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {visibleCards.map((card) => (
        <Link key={card.href} href={card.href}>
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
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}
