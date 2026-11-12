'use client';

import { PlanFeature } from '@boilerplate/shared';
import { PlanFeatureGate } from '@/components/billing/plan-feature-gate';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';
import { useBreadcrumb } from '@/contexts/breadcrumb-context';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { PageHeader } from '@/components/ui/page-header';
import { AuditLogView } from '@/components/audit/audit-log-view';

function AuditLogsContent() {
  useBreadcrumb([
    { label: 'Settings', href: '/dashboard/settings' },
    { label: 'Audit log', active: true },
  ]);

  return (
    <div className="space-y-4">
      <div data-tour="audit-header">
        <PageHeader
          title="Audit log"
          description="Every change made in your organization"
          backHref="/dashboard/settings"
        />
      </div>
      <AuditLogView />
    </div>
  );
}

export default function AuditLogsPage() {
  return (
    <PermissionGuard
      permissions={PERMISSIONS_ENUM.AUDIT_LIST_READ}
      fallback={
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          You don&apos;t have permission to view the audit log
        </div>
      }
    >
      <PlanFeatureGate feature={PlanFeature.AUDIT_LOG}>
        <AuditLogsContent />
      </PlanFeatureGate>
    </PermissionGuard>
  );
}
