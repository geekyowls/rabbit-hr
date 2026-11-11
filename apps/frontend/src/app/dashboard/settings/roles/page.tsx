'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Plus, ShieldCheck } from 'lucide-react';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';
import { usePermissions } from '@/hooks/use-permissions';
import { useAnalytics } from '@/hooks/use-analytics';
import { useBreadcrumb } from '@/contexts/breadcrumb-context';
import { PermissionGuard } from '@/components/auth/permission-guard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PageHeader } from '@/components/ui/page-header';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import {
  DataGrid,
  EmptyState,
  RowActions,
  StatusPill,
  ToolbarButton,
  type DataGridColumn,
  type RowAction,
} from '@/components/patterns';
import { toast } from '@/lib/toast';
import type { Role } from '@/types/role.type';

function RolesContent() {
  useBreadcrumb([
    { label: 'Settings', href: '/dashboard/settings' },
    { label: 'Roles', active: true },
  ]);
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const { hasPermission } = usePermissions();
  const { trackRoleEvent } = useAnalytics();

  const loadRoles = useCallback(async () => {
    try {
      const data = await fetchApi<Role[]>(API_ROUTES.ROLES.LIST_FULL, {
        method: 'POST',
      });
      setRoles(data || []);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load roles';
      toast.error(message);
      setRoles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  useEffect(() => {
    trackRoleEvent('VIEWED');
  }, [trackRoleEvent]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetchApi(API_ROUTES.ROLES.DELETE(deleteTarget.id), {
        method: 'DELETE',
      });
      toast.success('Role deleted');
      trackRoleEvent('DELETED', {
        roleId: deleteTarget.id,
        roleName: deleteTarget.name,
      });
      loadRoles();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to delete role';
      toast.error(message);
    } finally {
      setDeleteTarget(null);
    }
  };

  const canUpdate = hasPermission(PERMISSIONS_ENUM.ROLE_UPDATE);
  const editRole = (role: Role) =>
    router.push(`/dashboard/settings/roles/edit?id=${role.id}`);

  const rowActions = (role: Role): RowAction[] => [
    { label: 'Edit', onSelect: () => editRole(role) },
    ...(role.isDefault
      ? []
      : [
          {
            label: 'Delete',
            destructive: true,
            onSelect: () => setDeleteTarget(role),
          },
        ]),
  ];

  const columns: DataGridColumn<Role>[] = [
    {
      key: 'name',
      header: 'Role',
      width: 260,
      render: (r) => <span className="font-medium">{r.name}</span>,
    },
    {
      key: 'permissions',
      header: 'Permissions',
      width: 160,
      render: (r) =>
        `${r.permissions.length} permission${r.permissions.length === 1 ? '' : 's'}`,
    },
    {
      key: 'type',
      header: 'Type',
      width: 120,
      render: (r) =>
        r.isDefault ? (
          <StatusPill tone="info">Default</StatusPill>
        ) : (
          <StatusPill tone="neutral">Custom</StatusPill>
        ),
    },
    {
      key: 'updatedAt',
      header: 'Updated',
      width: 140,
      render: (r) => format(new Date(r.updatedAt), 'd MMM yyyy'),
    },
    ...(canUpdate
      ? [
          {
            key: 'actions',
            header: '',
            width: 56,
            align: 'center' as const,
            render: (r: Role) => (
              <div onClick={(e) => e.stopPropagation()}>
                <RowActions actions={rowActions(r)} />
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Roles"
        description="Who can see and do what across the workspace"
        backHref="/dashboard/settings"
        actions={
          hasPermission(PERMISSIONS_ENUM.ROLE_CREATE) ? (
            <ToolbarButton
              variant="primary"
              icon={Plus}
              onClick={() => router.push('/dashboard/settings/roles/new')}
            >
              New role
            </ToolbarButton>
          ) : undefined
        }
      />

      {isLoading ? (
        <TableSkeleton />
      ) : roles.length === 0 ? (
        <div className="rounded-md border border-border">
          <EmptyState
            icon={<ShieldCheck className="h-8 w-8" />}
            title="No roles yet"
            description="Create a role to group permissions for your team"
          />
        </div>
      ) : (
        <DataGrid
          columns={columns}
          rows={roles}
          getRowId={(r) => r.id}
          onRowClick={canUpdate ? editRole : undefined}
          pinFirstColumn
          maxHeight="calc(100vh - 14rem)"
        />
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete role</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteTarget?.name}&quot; will be deleted. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function SettingsRolesPage() {
  return (
    <PermissionGuard
      permissions={PERMISSIONS_ENUM.ROLE_LIST_READ}
      fallback={
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          You don&apos;t have permission to view roles
        </div>
      }
    >
      <RolesContent />
    </PermissionGuard>
  );
}
