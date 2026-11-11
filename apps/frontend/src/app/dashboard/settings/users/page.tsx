'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';
import {
  PERMISSIONS_ENUM,
  PERMISSION_BASE,
} from '@/constants/permissions.constants';
import { usePermissions } from '@/hooks/use-permissions';
import { useSession } from '@/contexts/session-context';
import { useImpersonation } from '@/hooks/use-impersonation';
import { useAnalytics } from '@/hooks/use-analytics';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { CreateUserDialog } from '@/components/users/create-user-dialog';
import { EditUserDialog } from '@/components/users/edit-user-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InitialsAvatar } from '@/components/ui/initials-avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ListPageSkeleton } from '@/components/ui/list-page-skeleton';
import { toast } from '@/lib/toast';
import { EllipsisVerticalIcon } from '@heroicons/react/24/solid';
import { Mail } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Checkbox } from '@/components/ui/checkbox';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  ColumnDef,
  VisibilityState,
} from '@tanstack/react-table';
import {
  DataTable,
  DataTablePagination,
} from '@/components/patterns/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserHierarchy } from '@/components/users/user-hierarchy';
import { SetManagerDialog } from '@/components/users/set-manager-dialog';

interface UserListItem {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: string;
  isActive: boolean;
  organizationId: string;
  roleId: string | null;
  role: { id: string; name: string } | null;
  createdAt: string;
  invitedBy: string | null;
  managerId: string | null;
  inviter: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
  manager: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
}

const statusVariant: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  active: 'default',
  invited: 'secondary',
  blocked: 'destructive',
  inactive: 'outline',
};

function UsersContent() {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UserListItem | null>(null);
  const [impersonateTarget, setImpersonateTarget] =
    useState<UserListItem | null>(null);
  const [impersonationPassword, setImpersonationPassword] = useState('');
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [setManagerTarget, setSetManagerTarget] = useState<UserListItem | null>(
    null,
  );
  const [resetPasswordTarget, setResetPasswordTarget] =
    useState<UserListItem | null>(null);
  const [resetPasswordResult, setResetPasswordResult] = useState<string | null>(
    null,
  );
  const [resetNotifyUser, setResetNotifyUser] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const { hasPermission } = usePermissions();
  const { user: currentUser } = useSession();
  const { startImpersonation, isImpersonating: hasActiveImpersonation } =
    useImpersonation();
  const { trackUserEvent } = useAnalytics();

  const loadUsers = useCallback(async () => {
    try {
      const data = await fetchApi<{ data: UserListItem[] }>(
        API_ROUTES.USERS.LIST,
        { method: 'POST', body: JSON.stringify({ page: 1, limit: 50 }) },
      );
      setUsers(data?.data || []);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load users';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleBlock = useCallback(
    async (userId: string) => {
      try {
        await fetchApi(API_ROUTES.USERS.BLOCK(userId), {
          method: 'POST',
        });
        toast.success('User blocked');
        trackUserEvent('BLOCKED', { userId });
        loadUsers();
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to block user';
        toast.error(message);
      }
    },
    [loadUsers, trackUserEvent],
  );

  const handleUnblock = useCallback(
    async (userId: string) => {
      try {
        await fetchApi(API_ROUTES.USERS.UNBLOCK(userId), {
          method: 'POST',
        });
        toast.success('User unblocked');
        trackUserEvent('UNBLOCKED', { userId });
        loadUsers();
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to unblock user';
        toast.error(message);
      }
    },
    [loadUsers, trackUserEvent],
  );

  const handleResendInvite = useCallback(
    async (userId: string) => {
      try {
        await fetchApi(API_ROUTES.USERS.RESEND_INVITE, {
          method: 'POST',
          body: JSON.stringify({ userId }),
        });
        toast.success('Invite resent');
        trackUserEvent('INVITE_RESENT', { userId });
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to resend invite';
        toast.error(message);
      }
    },
    [trackUserEvent],
  );

  const handleResetPassword = useCallback(async () => {
    if (!resetPasswordTarget) return;
    setIsResettingPassword(true);
    try {
      const result = await fetchApi<{
        generatedPassword: string;
      }>(API_ROUTES.USERS.RESET_PASSWORD(resetPasswordTarget.id), {
        method: 'POST',
        body: JSON.stringify({ notifyUser: resetNotifyUser }),
      });
      setResetPasswordResult(result.generatedPassword);
      toast.success('Password reset successfully');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to reset password';
      toast.error(message);
    } finally {
      setIsResettingPassword(false);
    }
  }, [resetPasswordTarget, resetNotifyUser]);

  const handleResetPasswordDialogClose = useCallback((open: boolean) => {
    if (!open) {
      setResetPasswordTarget(null);
      setResetPasswordResult(null);
      setResetNotifyUser(false);
      setIsResettingPassword(false);
    }
  }, []);

  const handleCopyResetPassword = useCallback(() => {
    if (resetPasswordResult) {
      navigator.clipboard.writeText(resetPasswordResult);
      toast.success('Password copied to clipboard');
    }
  }, [resetPasswordResult]);

  const getDisplayName = (user: UserListItem) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.email;
  };

  const handleImpersonateConfirm = useCallback(async () => {
    if (!impersonateTarget) return;
    if (hasActiveImpersonation) {
      toast.error(
        'Stop the current impersonation session before impersonating another user',
      );
      return;
    }
    if (!impersonationPassword.trim()) {
      toast.error('Current password is required to impersonate');
      return;
    }

    setIsImpersonating(true);
    try {
      await startImpersonation(impersonateTarget.id, impersonationPassword);
    } finally {
      setIsImpersonating(false);
    }
  }, [
    impersonateTarget,
    hasActiveImpersonation,
    impersonationPassword,
    startImpersonation,
  ]);

  const handleImpersonateDialogOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setImpersonateTarget(null);
      setImpersonationPassword('');
      setIsImpersonating(false);
    }
  }, []);

  const columns = useMemo<ColumnDef<UserListItem>[]>(
    () => [
      {
        accessorKey: 'email',
        header: 'User',
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <InitialsAvatar
              name={getDisplayName(row.original)}
              className="h-8 w-8 text-xs"
            />
            <div>
              <div className="font-medium">{getDisplayName(row.original)}</div>
              <div className="text-sm text-muted-foreground">
                {row.original.email}
              </div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        enableHiding: true,
        cell: ({ row }) => (
          <Badge variant={statusVariant[row.original.status] || 'outline'}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: 'role',
        header: 'Role',
        enableHiding: true,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.role?.name || 'No role'}
          </span>
        ),
      },
      {
        id: 'manager',
        header: 'Manager',
        enableHiding: true,
        cell: ({ row }) => {
          const mgr = row.original.manager;
          if (!mgr)
            return <span className="text-sm text-muted-foreground">-</span>;
          const name =
            [mgr.firstName, mgr.lastName].filter(Boolean).join(' ') ||
            mgr.email;
          return <span className="text-sm text-muted-foreground">{name}</span>;
        },
      },
      {
        id: 'actions',
        header: '',
        size: 48,
        enableHiding: false,
        cell: ({ row }) => {
          const user = row.original;
          const showActions =
            hasPermission(PERMISSIONS_ENUM.USER_UPDATE_STATUS) ||
            hasPermission(PERMISSIONS_ENUM.USER_CREATE) ||
            hasPermission(PERMISSION_BASE.USER_UPDATE) ||
            hasPermission(PERMISSIONS_ENUM.USER_IMPERSONATE) ||
            hasPermission(PERMISSIONS_ENUM.TEAM_MANAGE);

          if (!showActions) return null;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <EllipsisVerticalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {hasPermission(PERMISSION_BASE.USER_UPDATE) && (
                  <DropdownMenuItem onClick={() => setEditTarget(user)}>
                    Edit
                  </DropdownMenuItem>
                )}
                {hasPermission(PERMISSIONS_ENUM.TEAM_MANAGE) && (
                  <DropdownMenuItem onClick={() => setSetManagerTarget(user)}>
                    Set Manager
                  </DropdownMenuItem>
                )}
                {user.status === 'active' &&
                  user.id !== currentUser?.userId &&
                  hasPermission(PERMISSION_BASE.USER_UPDATE) && (
                    <DropdownMenuItem
                      onClick={() => setResetPasswordTarget(user)}
                    >
                      Reset Password
                    </DropdownMenuItem>
                  )}
                {user.status === 'invited' &&
                  hasPermission(PERMISSIONS_ENUM.USER_CREATE) && (
                    <DropdownMenuItem
                      onClick={() => handleResendInvite(user.id)}
                    >
                      Resend Invite
                    </DropdownMenuItem>
                  )}
                {user.status === 'active' &&
                  user.id !== currentUser?.userId &&
                  !hasActiveImpersonation &&
                  hasPermission(PERMISSIONS_ENUM.USER_IMPERSONATE) && (
                    <DropdownMenuItem
                      onClick={() => setImpersonateTarget(user)}
                    >
                      Impersonate
                    </DropdownMenuItem>
                  )}
                {user.status === 'active' &&
                  hasPermission(PERMISSIONS_ENUM.USER_UPDATE_STATUS) && (
                    <DropdownMenuItem
                      onClick={() => handleBlock(user.id)}
                      className="text-destructive"
                    >
                      Block
                    </DropdownMenuItem>
                  )}
                {user.status === 'blocked' &&
                  hasPermission(PERMISSIONS_ENUM.USER_UPDATE_STATUS) && (
                    <DropdownMenuItem onClick={() => handleUnblock(user.id)}>
                      Unblock
                    </DropdownMenuItem>
                  )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [
      hasPermission,
      hasActiveImpersonation,
      handleBlock,
      handleUnblock,
      handleResendInvite,
      currentUser?.userId,
    ],
  );

  const table = useReactTable({
    data: users,
    columns,
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  if (isLoading) {
    return <ListPageSkeleton filters={1} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Members"
        backHref="/dashboard/settings"
        actions={
          hasPermission(PERMISSIONS_ENUM.USER_CREATE) ? (
            <Button onClick={() => setCreateOpen(true)}>Create User</Button>
          ) : undefined
        }
      />

      <DataTable
        table={table}
        isLoading={isLoading}
        emptyMessage="No users found"
      />

      <DataTablePagination table={table} totalItems={users.length} />

      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={loadUsers}
      />

      <EditUserDialog
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
        onSuccess={loadUsers}
        user={editTarget}
      />

      <SetManagerDialog
        open={!!setManagerTarget}
        onOpenChange={(open) => !open && setSetManagerTarget(null)}
        targetUser={
          setManagerTarget
            ? {
                id: setManagerTarget.id,
                firstName: setManagerTarget.firstName,
                lastName: setManagerTarget.lastName,
                email: setManagerTarget.email,
                managerId: setManagerTarget.managerId,
                role: setManagerTarget.role,
                status: setManagerTarget.status,
              }
            : null
        }
        onSuccess={loadUsers}
      />

      <Dialog
        open={!!impersonateTarget}
        onOpenChange={handleImpersonateDialogOpenChange}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Impersonation</DialogTitle>
            <DialogDescription>
              Enter your current password to impersonate{' '}
              {impersonateTarget ? getDisplayName(impersonateTarget) : 'user'}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="impersonation-password">Current Password</Label>
            <Input
              id="impersonation-password"
              type="password"
              value={impersonationPassword}
              onChange={(event) => setImpersonationPassword(event.target.value)}
              placeholder="Enter your current password"
              disabled={isImpersonating}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void handleImpersonateConfirm();
                }
              }}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleImpersonateDialogOpenChange(false)}
              disabled={isImpersonating}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleImpersonateConfirm()}
              disabled={isImpersonating}
            >
              {isImpersonating ? 'Verifying...' : 'Impersonate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!resetPasswordTarget}
        onOpenChange={handleResetPasswordDialogClose}
      >
        <DialogContent>
          {resetPasswordResult ? (
            <>
              <DialogHeader>
                <DialogTitle>Password Reset</DialogTitle>
                <DialogDescription>
                  {resetNotifyUser
                    ? 'The new password has been sent to the user via email.'
                    : 'Save the new password. It will not be shown again.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label>New Password</Label>
                <div className="flex gap-2">
                  <Input
                    value={resetPasswordResult}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopyResetPassword}
                  >
                    Copy
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => handleResetPasswordDialogClose(false)}>
                  Done
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Reset Password</DialogTitle>
                <DialogDescription>
                  Generate a new password for{' '}
                  {resetPasswordTarget
                    ? getDisplayName(resetPasswordTarget)
                    : 'this user'}
                  . This will invalidate their current sessions.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="resetNotifyUser"
                  checked={resetNotifyUser}
                  onCheckedChange={(checked) =>
                    setResetNotifyUser(checked === true)
                  }
                  disabled={isResettingPassword}
                />
                <Label
                  htmlFor="resetNotifyUser"
                  className="flex items-center gap-1.5 text-sm font-normal cursor-pointer"
                >
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  Send new password via email
                </Label>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleResetPasswordDialogClose(false)}
                  disabled={isResettingPassword}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleResetPassword()}
                  disabled={isResettingPassword}
                >
                  {isResettingPassword ? 'Resetting...' : 'Reset Password'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SettingsUsersPage() {
  return (
    <div className="space-y-4">
      <PermissionGuard
        permissions={PERMISSION_BASE.USER_LIST_READ}
        fallback={
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            You don&apos;t have permission to view users
          </div>
        }
      >
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="hierarchy">Hierarchy</TabsTrigger>
          </TabsList>
          <TabsContent value="users">
            <UsersContent />
          </TabsContent>
          <TabsContent value="hierarchy">
            <UserHierarchy />
          </TabsContent>
        </Tabs>
      </PermissionGuard>
    </div>
  );
}
