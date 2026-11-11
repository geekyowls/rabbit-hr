'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Briefcase } from 'lucide-react';
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
import { JobFormDrawer } from '@/components/jobs/job-form-drawer';
import { userLabel } from '@/components/applications/application-meta';
import { JobDetailDrawer } from '@/components/jobs/job-detail-drawer';
import { ConfirmDialog } from '@/components/jobs/confirm-dialog';
import { ListFooter } from '@/components/jobs/list-footer';
import {
  EMPLOYMENT_TYPE_LABEL,
  JOB_STATUS_ACTION,
  JOB_STATUS_LABEL,
  JOB_STATUS_TONE,
  errorMessage,
  nextStatusActions,
} from '@/components/jobs/job-utils';
import {
  useClientsQuery,
  useDeleteJobMutation,
  useJobQuery,
  useJobsQuery,
  useUpdateJobStatusMutation,
  useUserNamesQuery,
} from '@/hooks/queries';
import { useDebounce } from '@/hooks/use-debounce';
import { useFormatters } from '@/hooks/use-formatters';
import { useOrganizationAtsSettings } from '@/hooks/queries/use-ats-settings-query';
import { usePermissions } from '@/hooks/use-permissions';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';
import { downloadCsv } from '@/lib/export-csv';
import { toast } from '@/lib/toast';
import {
  EMPLOYMENT_TYPES,
  JOB_STATUSES,
  type EmploymentType,
  type JobDetail,
  type JobListItem,
  type JobStatus,
} from '@/types/job.type';

const LIMIT = 25;
const ALL = 'all';

function JobsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();
  const canUpdate = hasPermission(PERMISSIONS_ENUM.JOB_UPDATE);
  const canDelete = hasPermission(PERMISSIONS_ENUM.JOB_DELETE);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>(ALL);
  const [clientId, setClientId] = useState<string>(
    searchParams.get('clientId') ?? ALL,
  );
  const [employmentType, setEmploymentType] = useState<string>(ALL);
  const [department, setDepartment] = useState(ALL);
  const [hiringManagerId, setHiringManagerId] = useState(ALL);
  const fmt = useFormatters();
  const { departments } = useOrganizationAtsSettings();
  const { data: users = [] } = useUserNamesQuery();
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<JobDetail | null>(null);
  const [deleting, setDeleting] = useState<JobListItem | null>(null);
  const debouncedSearch = useDebounce(search, 500);

  const detailId = searchParams.get('id');
  const setDetailId = (id: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id) params.set('id', id);
    else params.delete('id');
    const qs = params.toString();
    router.replace(qs ? `/dashboard/jobs?${qs}` : '/dashboard/jobs', {
      scroll: false,
    });
  };

  useEffect(() => {
    setPage(1);
  }, [
    debouncedSearch,
    status,
    clientId,
    employmentType,
    department,
    hiringManagerId,
  ]);

  const params = useMemo(
    () => ({
      page,
      limit: LIMIT,
      ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
      ...(status !== ALL ? { status: status as JobStatus } : {}),
      ...(clientId !== ALL ? { clientId } : {}),
      ...(employmentType !== ALL
        ? { employmentType: employmentType as EmploymentType }
        : {}),
      ...(department !== ALL ? { department } : {}),
      ...(hiringManagerId !== ALL ? { hiringManagerId } : {}),
    }),
    [
      page,
      debouncedSearch,
      status,
      clientId,
      employmentType,
      department,
      hiringManagerId,
    ],
  );

  const { data, isLoading, isError, error, isFetching } = useJobsQuery(params);
  const { data: clientsData } = useClientsQuery({ page: 1, limit: 100 });
  const detailQuery = useJobQuery(detailId);
  const updateStatus = useUpdateJobStatusMutation();
  const deleteJob = useDeleteJobMutation();

  useEffect(() => {
    if (isError) toast.error('Could not load jobs', errorMessage(error));
  }, [isError, error]);

  useEffect(() => {
    if (detailQuery.isError)
      toast.error('Could not load job', errorMessage(detailQuery.error));
  }, [detailQuery.isError, detailQuery.error]);

  const rows = data?.data ?? [];
  const listDetail = rows.find((r) => r.id === detailId) ?? null;
  const detail = detailQuery.data ?? listDetail;

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (job: JobDetail) => {
    setEditing(job);
    setFormOpen(true);
  };

  const changeStatus = async (job: JobDetail, next: JobStatus) => {
    if (job.status === next) return;
    try {
      await updateStatus.mutateAsync({ id: job.id, status: next });
      toast.success(`Job ${JOB_STATUS_LABEL[next].toLowerCase()}`, job.title);
    } catch (e) {
      toast.error('Could not update status', errorMessage(e));
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteJob.mutateAsync(deleting.id);
      toast.success('Job deleted', deleting.title);
      if (detailId === deleting.id) setDetailId(null);
    } catch (e) {
      toast.error('Could not delete job', errorMessage(e));
      throw e;
    }
  };

  const rowActions = (job: JobListItem): RowAction[] => [
    { label: 'View details', onSelect: () => setDetailId(job.id) },
    {
      label: 'View pipeline',
      onSelect: () => router.push(`/dashboard/pipeline?jobId=${job.id}`),
    },
    ...(canUpdate
      ? [
          { label: 'Edit', onSelect: () => openEdit(job) },
          ...nextStatusActions(job.status).map((s) => ({
            label: JOB_STATUS_ACTION[s],
            onSelect: () => changeStatus(job, s),
          })),
        ]
      : []),
    ...(canDelete
      ? [
          {
            label: 'Delete',
            destructive: true,
            onSelect: () => setDeleting(job),
          },
        ]
      : []),
  ];

  const columns: DataGridColumn<JobListItem>[] = [
    {
      key: 'title',
      header: 'Job title',
      width: 220,
      render: (r) => <span className="font-medium">{r.title}</span>,
    },
    {
      key: 'reference',
      header: 'Reference',
      width: 120,
      mono: true,
      render: (r) => r.reference,
    },
    {
      key: 'client',
      header: 'Client',
      width: 160,
      render: (r) =>
        r.client?.name ?? (
          <span className="text-muted-foreground">No client</span>
        ),
    },
    {
      key: 'department',
      header: 'Department',
      width: 140,
      render: (r) => r.department || '',
    },
    {
      key: 'hiringManager',
      header: 'Hiring manager',
      width: 150,
      render: (r) => userLabel(r.hiringManager),
    },
    {
      key: 'location',
      header: 'Location',
      width: 130,
      render: (r) => r.location || '',
    },
    {
      key: 'type',
      header: 'Type',
      width: 110,
      render: (r) => EMPLOYMENT_TYPE_LABEL[r.employmentType],
    },
    { key: 'pay', header: 'Pay', width: 200, render: (r) => fmt.pay(r) },
    {
      key: 'openings',
      header: 'Openings',
      width: 100,
      align: 'right',
      mono: true,
      render: (r) => r.openings,
    },
    {
      key: 'applicants',
      header: 'Applicants',
      width: 110,
      align: 'right',
      mono: true,
      render: (r) => r.applicationCount,
    },
    {
      key: 'status',
      header: 'Status',
      width: 120,
      render: (r) => (
        <StatusPill tone={JOB_STATUS_TONE[r.status]} dot>
          {JOB_STATUS_LABEL[r.status]}
        </StatusPill>
      ),
    },
    {
      key: 'posted',
      header: 'Posted',
      width: 120,
      mono: true,
      render: (r) => fmt.date(r.publishedAt ?? r.createdAt),
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
    downloadCsv('jobs', rows, [
      { header: 'Reference', value: (r) => r.reference },
      { header: 'Job title', value: (r) => r.title },
      { header: 'Client', value: (r) => r.client?.name ?? '' },
      { header: 'Department', value: (r) => r.department ?? '' },
      { header: 'Hiring manager', value: (r) => userLabel(r.hiringManager) },
      { header: 'Location', value: (r) => r.location ?? '' },
      { header: 'Type', value: (r) => EMPLOYMENT_TYPE_LABEL[r.employmentType] },
      { header: 'Pay', value: (r) => fmt.pay(r) },
      { header: 'Openings', value: (r) => r.openings },
      { header: 'Applicants', value: (r) => r.applicationCount },
      { header: 'Status', value: (r) => JOB_STATUS_LABEL[r.status] },
      {
        header: 'Posted',
        value: (r) => fmt.date(r.publishedAt ?? r.createdAt),
      },
    ]);

  const hasFilters =
    !!debouncedSearch.trim() ||
    status !== ALL ||
    clientId !== ALL ||
    employmentType !== ALL ||
    department !== ALL ||
    hiringManagerId !== ALL;

  return (
    <div className="-m-4 flex h-[calc(100vh-6rem)] flex-col gap-3 p-4">
      <FilterBar
        end={
          <>
            <ExportButton formats={['CSV']} onExport={exportRows} />
            <PermissionGuard permissions={PERMISSIONS_ENUM.JOB_CREATE}>
              <ToolbarButton
                variant="primary"
                icon={Briefcase}
                onClick={openNew}
              >
                New job
              </ToolbarButton>
            </PermissionGuard>
          </>
        }
      >
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search jobs..."
        />
        <FilterDropdown
          label="Status"
          value={status}
          options={[
            { label: 'All', value: ALL },
            ...JOB_STATUSES.map((s) => ({
              label: JOB_STATUS_LABEL[s],
              value: s,
            })),
          ]}
          onChange={setStatus}
        />
        <FilterDropdown
          label="Client"
          value={clientId}
          options={[
            { label: 'All', value: ALL },
            ...(clientsData?.data ?? []).map((c) => ({
              label: c.name,
              value: c.id,
            })),
          ]}
          onChange={setClientId}
        />
        <FilterDropdown
          label="Type"
          value={employmentType}
          options={[
            { label: 'All', value: ALL },
            ...EMPLOYMENT_TYPES.map((t) => ({
              label: EMPLOYMENT_TYPE_LABEL[t],
              value: t,
            })),
          ]}
          onChange={setEmploymentType}
        />
        {departments.length > 0 && (
          <FilterDropdown
            label="Department"
            value={department}
            options={[
              { label: 'All', value: ALL },
              ...departments.map((d) => ({ label: d, value: d })),
            ]}
            onChange={setDepartment}
          />
        )}
        <FilterDropdown
          label="Hiring manager"
          value={hiringManagerId}
          options={[
            { label: 'All', value: ALL },
            ...users.map((u) => ({ label: userLabel(u), value: u.id })),
          ]}
          onChange={setHiringManagerId}
        />
      </FilterBar>

      <div className="flex min-h-0 flex-1 flex-col">
        {isLoading ? (
          <TableSkeleton />
        ) : rows.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-md border border-border">
            <EmptyState
              icon={<Briefcase className="h-8 w-8" />}
              title={hasFilters ? 'No jobs match these filters' : 'No jobs yet'}
              description={
                hasFilters
                  ? 'Try a different search or clear the filters'
                  : 'Create your first job to start receiving applications'
              }
              action={
                !hasFilters && (
                  <PermissionGuard permissions={PERMISSIONS_ENUM.JOB_CREATE}>
                    <ToolbarButton
                      variant="primary"
                      icon={Briefcase}
                      onClick={openNew}
                    >
                      New job
                    </ToolbarButton>
                  </PermissionGuard>
                )
              }
            />
          </div>
        ) : (
          <>
            <DataGrid
              columns={columns}
              rows={rows}
              getRowId={(r) => r.id}
              onRowClick={(r) => setDetailId(r.id)}
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

      <JobFormDrawer open={formOpen} onOpenChange={setFormOpen} job={editing} />

      <JobDetailDrawer
        open={!!detailId && !formOpen}
        onOpenChange={(o) => !o && setDetailId(null)}
        job={detail}
        loading={detailQuery.isLoading}
        onEdit={openEdit}
        onDelete={(job) => setDeleting(job)}
        onStatusChange={changeStatus}
        statusPending={updateStatus.isPending}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete job"
        description={
          deleting
            ? `${deleting.title} and its applications will be removed. This cannot be undone.`
            : undefined
        }
        onConfirm={confirmDelete}
      />
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <JobsPageContent />
    </Suspense>
  );
}
