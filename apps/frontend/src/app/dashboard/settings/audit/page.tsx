'use client';

import { useState, useEffect } from 'react';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { isSystemAdminAccess } from '@/utils/cookies';
import { PageHeader } from '@/components/ui/page-header';
import { AuditLogView } from '@/components/audit/audit-log-view';

function AuditLogsContent() {
  return (
    <div className="space-y-6">
      <div data-tour="audit-header">
        <PageHeader title="Audit Logs" backHref="/dashboard/settings" />
      </div>
      <AuditLogView />
    </div>
  );
}

export default function AuditLogsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  if (!isSystemAdminAccess()) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Audit logs are not available
      </div>
    );
  }

  return (
    <PermissionGuard
      permissions={PERMISSIONS_ENUM.AUDIT_LIST_READ}
      fallback={
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          You don&apos;t have permission to view audit logs
        </div>
      }
    >
      <AuditLogsContent />
    </PermissionGuard>
  );
}
