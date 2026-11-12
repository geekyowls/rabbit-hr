'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Mail, UserPlus, Users } from 'lucide-react';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';
import {
  PERMISSIONS_ENUM,
  PERMISSION_BASE,
} from '@/constants/permissions.constants';
import { usePermissions } from '@/hooks/use-permissions';
import { useDebounce } from '@/hooks/use-debounce';
import { useSession } from '@/contexts/session-context';
import { useBreadcrumb } from '@/contexts/breadcrumb-context';
import { useImpersonation } from '@/hooks/use-impersonation';
import { useAnalytics } from '@/hooks/use-analytics';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { CreateUserDialog } from '@/components/users/create-user-dialog';
import { EditUserDialog } from '@/components/users/edit-user-dialog';
import { UserHierarchy } from '@/components/users/user-hierarchy';
import { SetManagerDialog } from '@/components/users/set-manager-dialog';
import { ListFooter } from '@/components/jobs/list-footer';
import { Button } from '@/components/ui/button';
import { InitialsAvatar } from '@/components/ui/initials-avatar';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DataGrid,
  EmptyState,
  FilterBar,
  FilterDropdown,
  RowActions,
  SearchInput,
  SegmentedControl,
  StatusPill,
  ToolbarButton,
  type DataGridColumn,
  type PillTone,
  type RowAction,
} from '@/components/patterns';
import { toast } from '@/lib/toast';

function getDisplayName(user: {
  firstName: string | null;
  lastName: string | null;
  email: string;
}) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ');
  return name || user.email;
}

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

const LIMIT = 25;
const ALL = 'all';

const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  invited: 'Invited',
  blocked: 'Blocked',
  inactive: 'Inactive',
};

const STATUS_TONE: Record<string, PillTone> = {
  active: 'success',
  invited: 'info',
  blocked: 'danger',
  inactive: 'neutral',
};

interface UsersPage {
  data: UserListItem[];
  page: number;
  total: number;
  totalPages: number;
}

const EMPTY_PAGE: UsersPage = { data: [], page: 1, total: 0, totalPages: 1 };

function UsersContent({
  createOpen,
  onCreateOpenChange,
}: {
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
}) {
  const [data, setData] = useState<UsersPage>(EMPTY_PAGE);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>(ALL);
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 500);
  const [editTarget, setEditTarget] = useState<UserListItem | null>(null);
  const [impersonateTarget, setImpersonateTarget] =
    useState<UserListItem | null>(null);
  const [impersonationPassword, setImpersonationPassword] = useState('');
  const [isImpersonating, setIsImpersonating] = useState(false);
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

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  const loadUsers = useCallback(async () => {
    setIsFetching(true);
    try {
      const result = await fetchApi<UsersPage>(API_ROUTES.USERS.LIST, {
        method: 'POST',
        body: JSON.stringify({
          page,
          limit: LIMIT,
          ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
          ...(status !== ALL ? { status } : {}),
        }),
      });
      setData(result ?? EMPTY_PAGE);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load users';
      toast.error(message);
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, [page, debouncedSearch, status]);

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
      toast.success('Password reset');
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
      toast.success('Password copied');
    }
  }, [resetPasswordResult]);

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

  const canSeeActions =
    hasPermission(PERMISSIONS_ENUM.USER_UPDATE_STATUS) ||
    hasPermission(PERMISSIONS_ENUM.USER_CREATE) ||
    hasPermission(PERMISSION_BASE.USER_UPDATE) ||
    hasPermission(PERMISSIONS_ENUM.USER_IMPERSONATE) ||
    hasPermission(PERMISSIONS_ENUM.TEAM_MANAGE);

  const rowActions = (user: UserListItem): RowAction[] => {
    const isSelf = user.id === currentUser?.userId;
    const isActive = user.status === 'active';
    const actions: RowAction[] = [];
    if (hasPermission(PERMISSION_BASE.USER_UPDATE))
      actions.push({ label: 'Edit', onSelect: () => setEditTarget(user) });
    if (hasPermission(PERMISSIONS_ENUM.TEAM_MANAGE))
      actions.push({
        label: 'Set manager',
        onSelect: () => setSetManagerTarget(user),
      });
    if (isActive && !isSelf && hasPermission(PERMISSION_BASE.USER_UPDATE))
      actions.push({
        label: 'Reset password',
        onSelect: () => setResetPasswordTarget(user),
      });
    if (
      user.status === 'invited' &&
      hasPermission(PERMISSIONS_ENUM.USER_CREATE)
    )
      actions.push({
        label: 'Resend invite',
        onSelect: () => handleResendInvite(user.id),
      });
    if (
      isActive &&
      !isSelf &&
      !hasActiveImpersonation &&
      hasPermission(PERMISSIONS_ENUM.USER_IMPERSONATE)
    )
      actions.push({
        label: 'Impersonate',
        onSelect: () => setImpersonateTarget(user),
      });
    if (isActive && hasPermission(PERMISSIONS_ENUM.USER_UPDATE_STATUS))
      actions.push({
        label: 'Block',
        destructive: true,
        onSelect: () => handleBlock(user.id),
      });
    if (
      user.status === 'blocked' &&
      hasPermission(PERMISSIONS_ENUM.USER_UPDATE_STATUS)
    )
      actions.push({
        label: 'Unblock',
        onSelect: () => handleUnblock(user.id),
      });
    return actions;
  };

  const columns: DataGridColumn<UserListItem>[] = [
    {
      key: 'user',
      header: 'User',
      width: 280,
      render: (r) => (
        <span className="flex items-center gap-2">
          <InitialsAvatar
            name={getDisplayName(r)}
            className="h-6 w-6 text-[10px]"
          />
          <span className="min-w-0">
            <span className="block truncate font-medium">
              {getDisplayName(r)}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {r.email}
            </span>
          </span>
        </span>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      width: 160,
      render: (r) =>
        r.role?.name ?? <span className="text-muted-foreground">No role</span>,
    },
    {
      key: 'manager',
      header: 'Manager',
      width: 180,
      render: (r) =>
        r.manager ? (
          getDisplayName(r.manager)
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      width: 120,
      render: (r) => (
        <StatusPill tone={STATUS_TONE[r.status] ?? 'neutral'} dot>
          {STATUS_LABEL[r.status] ?? r.status}
        </StatusPill>
      ),
    },
    {
      key: 'createdAt',
      header: 'Added',
      width: 130,
      render: (r) => format(new Date(r.createdAt), 'd MMM yyyy'),
    },
    ...(canSeeActions
      ? [
          {
            key: 'actions',
            header: '',
            width: 56,
            align: 'center' as const,
            render: (r: UserListItem) => {
              const actions = rowActions(r);
              return actions.length > 0 ? (
                <RowActions actions={actions} />
              ) : null;
            },
          },
        ]
      : []),
  ];

  const hasFilters = !!debouncedSearch.trim() || status !== ALL;

  return (
    <>
      <FilterBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search users..."
        />
        <FilterDropdown
          label="Status"
          value={status}
          options={[
            { label: 'All', value: ALL },
            ...Object.entries(STATUS_LABEL).map(([value, label]) => ({
              label,
              value,
            })),
          ]}
          onChange={setStatus}
        />
      </FilterBar>

      {isLoading ? (
        <TableSkeleton />
      ) : data.data.length === 0 ? (
        <div className="rounded-md border border-border">
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title={hasFilters ? 'No users match these filters' : 'No users yet'}
            description={
              hasFilters
                ? 'Try a different search or status'
                : 'Add the people who work in this organization'
            }
          />
        </div>
      ) : (
        <div>
          <DataGrid
            columns={columns}
            rows={data.data}
            getRowId={(r) => r.id}
            pinFirstColumn
            maxHeight="calc(100vh - 18rem)"
            className={isFetching ? 'opacity-70' : undefined}
          />
          <ListFooter
            page={data.page}
            limit={LIMIT}
            total={data.total}
            totalPages={data.totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      <CreateUserDialog
        open={createOpen}
        onOpenChange={onCreateOpenChange}
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
            <DialogTitle>Confirm impersonation</DialogTitle>
            <DialogDescription>
              Enter your current password to impersonate{' '}
              {impersonateTarget ? getDisplayName(impersonateTarget) : 'user'}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="impersonation-password">Current password</Label>
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
              {isImpersonating ? 'Verifying' : 'Impersonate'}
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
                <DialogTitle>Password reset</DialogTitle>
                <DialogDescription>
                  {resetNotifyUser
                    ? 'The new password has been sent to the user via email.'
                    : 'Save the new password. It will not be shown again.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label>New password</Label>
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
                <DialogTitle>Reset password</DialogTitle>
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
                  {isResettingPassword ? 'Resetting' : 'Reset password'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

type UsersView = 'users' | 'hierarchy';

function SettingsUsersContent() {
  useBreadcrumb([
    { label: 'Settings', href: '/dashboard/settings' },
    { label: 'Users', active: true },
  ]);
  const { hasPermission } = usePermissions();
  const [view, setView] = useState<UsersView>('users');
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Users"
        description="Team members, their roles and reporting lines"
        backHref="/dashboard/settings"
        actions={
          hasPermission(PERMISSIONS_ENUM.USER_CREATE) ? (
            <ToolbarButton
              variant="primary"
              icon={UserPlus}
              onClick={() => setCreateOpen(true)}
            >
              New user
            </ToolbarButton>
          ) : undefined
        }
      />

      <SegmentedControl
        value={view}
        onChange={setView}
        options={[
          { value: 'users', label: 'Users' },
          { value: 'hierarchy', label: 'Hierarchy' },
        ]}
      />

      {view === 'users' ? (
        <UsersContent
          createOpen={createOpen}
          onCreateOpenChange={setCreateOpen}
        />
      ) : (
        <UserHierarchy />
      )}
    </div>
  );
}

export default function SettingsUsersPage() {
  return (
    <PermissionGuard
      permissions={PERMISSION_BASE.USER_LIST_READ}
      fallback={
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          You don&apos;t have permission to view users
        </div>
      }
    >
      <SettingsUsersContent />
    </PermissionGuard>
  );
}
