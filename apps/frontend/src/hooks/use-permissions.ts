import { useSession } from '@/contexts/session-context';
import { Permission } from '@/types/permissions.type';
import { PermissionScope } from '@/constants/permissions.constants';

export function usePermissions() {
  const { user } = useSession();
  const isDevBypass = process.env.NEXT_PUBLIC_DEV_BYPASS_PERMISSIONS === 'true';

  const hasPermission = (requiredPermission: Permission | string): boolean => {
    if (isDevBypass) return true;
    if (!user?.permissions?.length) return false;
    return user.permissions.some(
      (p) => p === requiredPermission || p.startsWith(requiredPermission + ':'),
    );
  };

  const hasAnyPermission = (
    requiredPermissions: (Permission | string)[],
  ): boolean => {
    if (isDevBypass) return true;
    if (!requiredPermissions.length) return true;
    if (!user?.permissions?.length) return false;
    return requiredPermissions.some((required) =>
      user.permissions.some(
        (p) => p === required || p.startsWith(required + ':'),
      ),
    );
  };

  const hasAllPermissions = (
    requiredPermissions: (Permission | string)[],
  ): boolean => {
    if (isDevBypass) return true;
    if (!user?.permissions?.length) return false;
    return requiredPermissions.every((required) =>
      user.permissions.some(
        (p) => p === required || p.startsWith(required + ':'),
      ),
    );
  };

  const getScope = (basePermission: string): PermissionScope | null => {
    if (isDevBypass) return PermissionScope.ALL;
    if (!user?.permissions?.length) return null;
    if (
      user.permissions.includes(
        `${basePermission}:${PermissionScope.ALL}` as Permission,
      )
    )
      return PermissionScope.ALL;
    if (
      user.permissions.includes(
        `${basePermission}:${PermissionScope.TEAM}` as Permission,
      )
    )
      return PermissionScope.TEAM;
    if (
      user.permissions.includes(
        `${basePermission}:${PermissionScope.OWN}` as Permission,
      )
    )
      return PermissionScope.OWN;
    if (user.permissions.includes(basePermission as Permission))
      return PermissionScope.ALL;
    return null;
  };

  return { hasPermission, hasAnyPermission, hasAllPermissions, getScope };
}
