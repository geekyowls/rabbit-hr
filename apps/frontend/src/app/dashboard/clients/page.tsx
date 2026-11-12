'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2 } from 'lucide-react';
import {
  FilterBar,
  FilterDropdown,
  SearchInput,
  ExportButton,
  ToolbarButton,
  DataGrid,
  StatusPill,
  RowActions,
  EmptyState,
  type DataGridColumn,
  type RowAction,
} from '@/components/patterns';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { ClientFormDrawer } from '@/components/clients/client-form-drawer';
import {
  CLIENT_STATUS_LABEL,
  CLIENT_STATUS_TONE,
  ClientLogo,
} from '@/components/clients/client-utils';
import { ConfirmDialog } from '@/components/jobs/confirm-dialog';
import { ListFooter } from '@/components/jobs/list-footer';
import { errorMessage } from '@/components/jobs/job-utils';
import {
  useClientsQuery,
  useDeleteClientMutation,
  useUpdateClientMutation,
} from '@/hooks/queries';
import { useDebounce } from '@/hooks/use-debounce';
import { usePermissions } from '@/hooks/use-permissions';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';
import { downloadCsv } from '@/lib/export-csv';
import { toast } from '@/lib/toast';
import {
  CLIENT_STATUSES,
  type ClientListItem,
  type ClientStatus,
} from '@/types/client.type';

const LIMIT = 25;
const ALL = 'all';

export default function ClientsPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const canUpdate = hasPermission(PERMISSIONS_ENUM.CLIENT_UPDATE);
  const canDelete = hasPermission(PERMISSIONS_ENUM.CLIENT_DELETE);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('active');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ClientListItem | null>(null);
  const [deleting, setDeleting] = useState<ClientListItem | null>(null);
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  const params = useMemo(
    () => ({
      page,
      limit: LIMIT,
      ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
      ...(status !== ALL ? { status: status as ClientStatus } : {}),
    }),
    [page, debouncedSearch, status],
  );

  const { data, isLoading, isError, error, isFetching } =
    useClientsQuery(params);
  const updateClient = useUpdateClientMutation();
  const deleteClient = useDeleteClientMutation();

  useEffect(() => {
    if (isError) toast.error('Could not load clients', errorMessage(error));
  }, [isError, error]);

  const rows = data?.data ?? [];
  const openDetail = (id: string) =>
    router.push(`/dashboard/clients/details?id=${id}`);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const toggleRetired = async (client: ClientListItem) => {
    const next: ClientStatus =
      client.status === 'active' ? 'retired' : 'active';
    try {
      await updateClient.mutateAsync({ id: client.id, data: { status: next } });
      toast.success(
        next === 'retired' ? 'Client retired' : 'Client reactivated',
        client.name,
      );
    } catch (e) {
      toast.error('Could not update client', errorMessage(e));
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteClient.mutateAsync(deleting.id);
      toast.success('Client deleted', deleting.name);
    } catch (e) {
      toast.error('Could not delete client', errorMessage(e));
      throw e;
    }
  };

  const rowActions = (c: ClientListItem): RowAction[] => [
    { label: 'View details', onSelect: () => openDetail(c.id) },
    ...(canUpdate
      ? [
          {
            label: 'Edit',
            onSelect: () => {
              setEditing(c);
              setFormOpen(true);
            },
          },
          {
            label: c.status === 'active' ? 'Retire' : 'Reactivate',
            onSelect: () => toggleRetired(c),
          },
        ]
      : []),
    ...(canDelete
      ? [{ label: 'Delete', destructive: true, onSelect: () => setDeleting(c) }]
      : []),
  ];

  const columns: DataGridColumn<ClientListItem>[] = [
    {
      key: 'name',
      header: 'Client',
      width: 240,
      render: (r) => (
        <span className="flex items-center gap-2">
          <ClientLogo
            name={r.name}
            logoUrl={r.logoUrl}
            brandColor={r.brandColor}
            className="h-6 w-6 text-[10px]"
          />
          <span className="truncate font-medium">{r.name}</span>
        </span>
      ),
    },
    {
      key: 'industry',
      header: 'Industry',
      width: 150,
      render: (r) => r.industry ?? '',
    },
    {
      key: 'city',
      header: 'City',
      width: 130,
      render: (r) => r.address?.city ?? '',
    },
    {
      key: 'contacts',
      header: 'Contacts',
      width: 100,
      align: 'right',
      mono: true,
      render: (r) => r.contactCount,
    },
    {
      key: 'openJobs',
      header: 'Open jobs',
      width: 110,
      align: 'right',
      mono: true,
      render: (r) => r.openJobCount,
    },
    {
      key: 'applications',
      header: 'Applications',
      width: 120,
      align: 'right',
      mono: true,
      render: (r) => r.applicationCount,
    },
    {
      key: 'status',
      header: 'Status',
      width: 110,
      render: (r) => (
        <StatusPill tone={CLIENT_STATUS_TONE[r.status]} dot>
          {CLIENT_STATUS_LABEL[r.status]}
        </StatusPill>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: 56,
      align: 'center',
      render: (r) => (
        <div onClick={(e) => e.stopPropagation()}>
          <RowActions actions={rowActions(r)} />
        </div>
      ),
    },
  ];

  const exportRows = () =>
    downloadCsv('clients', rows, [
      { header: 'Client', value: (r) => r.name },
      { header: 'Industry', value: (r) => r.industry ?? '' },
      { header: 'City', value: (r) => r.address?.city ?? '' },
      { header: 'Contacts', value: (r) => r.contactCount },
      { header: 'Open jobs', value: (r) => r.openJobCount },
      { header: 'Applications', value: (r) => r.applicationCount },
      { header: 'Status', value: (r) => CLIENT_STATUS_LABEL[r.status] },
    ]);

  const hasFilters = !!debouncedSearch.trim() || status !== ALL;

  return (
    <div className="-m-4 flex h-[calc(100vh-6rem)] flex-col gap-3 p-4">
      <FilterBar
        end={
          <>
            <ExportButton formats={['CSV']} onExport={exportRows} />
            <PermissionGuard permissions={PERMISSIONS_ENUM.CLIENT_CREATE}>
              <ToolbarButton
                variant="primary"
                icon={Building2}
                onClick={openNew}
              >
                New client
              </ToolbarButton>
            </PermissionGuard>
          </>
        }
      >
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search clients..."
        />
        <FilterDropdown
          label="Status"
          value={status}
          options={[
            { label: 'All', value: ALL },
            ...CLIENT_STATUSES.map((s) => ({
              label: CLIENT_STATUS_LABEL[s],
              value: s,
            })),
          ]}
          onChange={setStatus}
        />
      </FilterBar>

      <div className="flex min-h-0 flex-1 flex-col">
        {isLoading ? (
          <TableSkeleton />
        ) : rows.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-md border border-border">
            <EmptyState
              icon={<Building2 className="h-8 w-8" />}
              title={
                hasFilters ? 'No clients match these filters' : 'No clients yet'
              }
              description={
                hasFilters
                  ? 'Try a different search or status'
                  : 'Add the companies you recruit for'
              }
              action={
                <PermissionGuard permissions={PERMISSIONS_ENUM.CLIENT_CREATE}>
                  <ToolbarButton
                    variant="primary"
                    icon={Building2}
                    onClick={openNew}
                  >
                    New client
                  </ToolbarButton>
                </PermissionGuard>
              }
            />
          </div>
        ) : (
          <>
            <DataGrid
              columns={columns}
              rows={rows}
              getRowId={(r) => r.id}
              onRowClick={(r) => openDetail(r.id)}
              pinFirstColumn
              maxHeight="100%"
              className={isFetching ? 'flex-1 opacity-70' : 'flex-1'}
            />
            <ListFooter
              page={data?.page ?? page}
              limit={LIMIT}
              total={data?.total ?? 0}
              totalPages={data?.totalPages ?? 1}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      <ClientFormDrawer
        open={formOpen}
        onOpenChange={setFormOpen}
        client={editing}
        onSaved={(c) => !editing && openDetail(c.id)}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete client"
        description={
          deleting
            ? `${deleting.name} and its contacts will be removed, its jobs will be unlinked. This cannot be undone.`
            : undefined
        }
        onConfirm={confirmDelete}
      />
    </div>
  );
}
