'use client';

import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/use-permissions';
import { useSession } from '@/contexts/session-context';
import { Permission } from '@/types/permissions.type';

interface PermissionGuardProps {
  children: ReactNode;
  permissions: Permission | Permission[] | string | string[];
  requireAll?: boolean;
  fallback?: ReactNode;
}

export function PermissionGuard({
  children,
  permissions,
  requireAll = false,
  fallback = null,
}: PermissionGuardProps) {
  const { isAuthenticated, isLoading } = useSession();
  const { hasAnyPermission, hasAllPermissions } = usePermissions();
  const isDevBypass = process.env.NEXT_PUBLIC_DEV_BYPASS_PERMISSIONS === 'true';

  if (isDevBypass) {
    return <>{children}</>;
  }

  if (isLoading || !isAuthenticated) {
    return fallback;
  }

  const permissionArray = Array.isArray(permissions)
    ? permissions
    : [permissions];
  const hasAccess = requireAll
    ? hasAllPermissions(permissionArray)
    : hasAnyPermission(permissionArray);

  return hasAccess ? <>{children}</> : fallback;
}
