'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/utils/api-client';
import { API_ROUTES } from '@/config/api-routes';
import { useDebounce } from '@/hooks/use-debounce';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/lib/toast';
import {
  setSystemAdminAccess,
  setSystemAccessToken,
  clearSystemAccessToken,
} from '@/utils/cookies';
import { formatDateTime } from '@/lib/utils';
import { EllipsisVerticalIcon } from '@heroicons/react/24/solid';
import { X, Shield } from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  PaginationState,
} from '@tanstack/react-table';
import { DataTable, DataTablePagination } from '@/components/common/data-table';
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

interface Organization {
  id: string;
  name: string;
  slug: string;
  domain: string;
  status: string;
  email: string | null;
  phone: string | null;
  userCount: number;
  createdAt: string;
}

interface OrganizationsListResponse {
  data: Organization[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
  active: 'default',
  inactive: 'secondary',
  suspended: 'destructive',
};

export default function OrganizationsPage() {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const debouncedSearch = useDebounce(search, 500);
  const [syncPermissionsOpen, setSyncPermissionsOpen] = useState(false);
  const [isSyncingPermissions, setIsSyncingPermissions] = useState(false);

  const loadOrganizations = useCallback(async () => {
    setIsLoading(true);
    try {
      const body: Record<string, unknown> = {
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      };
      if (debouncedSearch) body.search = debouncedSearch;
      if (statusFilter && statusFilter !== 'all') body.status = statusFilter;

      const data = await fetchApi<OrganizationsListResponse>(
        API_ROUTES.SYSTEM_ADMIN.ORGANIZATIONS.LIST,
        {
          method: 'POST',
          body: JSON.stringify(body),
        },
      );

      setOrganizations(data?.data || []);
      setTotalItems(data?.total || 0);
      setTotalPages(data?.totalPages || 0);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load organizations';
      toast.error(message);
      setOrganizations([]);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.pageIndex, pagination.pageSize, debouncedSearch, statusFilter]);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [debouncedSearch, statusFilter]);

  const handleUpdateStatus = useCallback(
    async (orgId: string, newStatus: string) => {
      try {
        await fetchApi(
          API_ROUTES.SYSTEM_ADMIN.ORGANIZATIONS.UPDATE_STATUS(orgId),
          {
            method: 'PATCH',
            body: JSON.stringify({ status: newStatus }),
          },
        );
        toast.success('Organization status updated');
        loadOrganizations();
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to update status';
        toast.error(message);
      }
    },
    [loadOrganizations],
  );

  const handleAccessOrg = useCallback(async (orgId: string) => {
    try {
      const data = await fetchApi<{ accessToken: string }>(
        API_ROUTES.SYSTEM_ADMIN.ORGANIZATIONS.ACCESS(orgId),
        { method: 'POST' },
      );

      setSystemAdminAccess(true);
      setSystemAccessToken(data.accessToken);
      window.location.href = '/dashboard';
    } catch (err: unknown) {
      clearSystemAccessToken();
      const message =
        err instanceof Error ? err.message : 'Failed to access organization';
      toast.error(message);
    }
  }, []);

  const handleSyncAllPermissions = async () => {
    setIsSyncingPermissions(true);
    try {
      const result = await fetchApi<{ updated: number; organizations: number }>(
        API_ROUTES.SYSTEM_ADMIN.SYNC_PERMISSIONS,
        { method: 'POST', body: JSON.stringify({}) },
      );
      setSyncPermissionsOpen(false);
      toast.success(
        `${result.updated} default role${result.updated !== 1 ? 's' : ''} updated across ${result.organizations} organization${result.organizations !== 1 ? 's' : ''}`,
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to sync permissions';
      toast.error(message);
    } finally {
      setIsSyncingPermissions(false);
    }
  };

  const columns = useMemo<ColumnDef<Organization>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Organization',
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.name}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.slug}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'userCount',
        header: 'Users',
        cell: ({ row }) => (
          <span className="text-sm">{row.original.userCount}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={statusVariant[row.original.status] || 'secondary'}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDateTime(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 48,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <EllipsisVerticalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleAccessOrg(row.original.id)}>
                Access Dashboard
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {row.original.status === 'active' && (
                <DropdownMenuItem
                  onClick={() =>
                    handleUpdateStatus(row.original.id, 'suspended')
                  }
                  className="text-destructive"
                >
                  Suspend
                </DropdownMenuItem>
              )}
              {row.original.status !== 'active' && (
                <DropdownMenuItem
                  onClick={() => handleUpdateStatus(row.original.id, 'active')}
                >
                  Activate
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [handleUpdateStatus, handleAccessOrg],
  );

  const table = useReactTable({
    data: organizations,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Organizations</h2>
          <p className="text-sm text-muted-foreground">
            Manage organizations in the system
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setSyncPermissionsOpen(true)}
            disabled={isSyncingPermissions}
          >
            <Shield className="h-4 w-4 mr-2" />
            {isSyncingPermissions ? 'Syncing...' : 'Sync All Permissions'}
          </Button>
          <Button onClick={() => router.push('/system/organizations/create')}>
            Create Organization
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <Input
            placeholder="Search by name, slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {(search || statusFilter !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch('');
              setStatusFilter('all');
            }}
          >
            <X className="mr-1 h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>

      <DataTable
        table={table}
        isLoading={isLoading}
        emptyMessage="No organizations found"
      />

      <DataTablePagination table={table} totalItems={totalItems} />

      <AlertDialog
        open={syncPermissionsOpen}
        onOpenChange={setSyncPermissionsOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sync All Permissions</AlertDialogTitle>
            <AlertDialogDescription>
              This will update the default admin role in every organization with
              all current permissions. Existing custom roles are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSyncingPermissions}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSyncAllPermissions}
              disabled={isSyncingPermissions}
            >
              {isSyncingPermissions ? 'Syncing...' : 'Sync All'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
