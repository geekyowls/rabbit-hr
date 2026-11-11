'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FilePlus2, FileSignature } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InitialsAvatar } from '@/components/ui/initials-avatar';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import {
  DataGrid,
  EmptyState,
  ExportButton,
  FilterBar,
  FilterDropdown,
  SearchInput,
  StatTile,
  StatTileRow,
  StatusPill,
  ToolbarButton,
  type DataGridColumn,
} from '@/components/patterns';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { OfferFormDrawer } from '@/components/offers/offer-form-drawer';
import { OfferDetailDrawer } from '@/components/offers/offer-detail-drawer';
import { ListFooter } from '@/components/jobs/list-footer';
import { errorMessage } from '@/components/applications/application-meta';
import {
  OFFER_STATUSES,
  OFFER_STATUS_LABEL,
  OFFER_STATUS_TONE,
  approvalSummary,
  approverName,
  candidateName,
  offerSalary,
} from '@/components/offers/offer-meta';
import { useOfferStatusCounts } from '@/components/offers/use-offer-status-counts';
import {
  useClientsQuery,
  useJobsQuery,
  useOfferQuery,
  useOffersQuery,
} from '@/hooks/queries';
import { useDebounce } from '@/hooks/use-debounce';
import { useFormatters } from '@/hooks/use-formatters';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';
import { downloadCsv } from '@/lib/export-csv';
import { toast } from '@/lib/toast';
import type { Offer, OfferStatus } from '@/types/offer.type';

const LIMIT = 25;
const ALL = 'all';
const BASE = '/dashboard/offers';

const DECISION_RING = {
  approved: 'ring-[#3F6650] dark:ring-[#8FBFA1]',
  rejected: 'ring-red-500 dark:ring-red-400',
  pending: 'ring-border',
};

function OffersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fmt = useFormatters();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>(
    searchParams.get('status') ?? ALL,
  );
  const [jobId, setJobId] = useState<string>(ALL);
  const [clientId, setClientId] = useState<string>(ALL);
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Offer | null>(null);
  const debouncedSearch = useDebounce(search, 500);

  const detailId = searchParams.get('id');
  const isNew = searchParams.get('new') === '1';
  const [prefillApplicationId, setPrefillApplicationId] = useState<
    string | null
  >(null);

  const replaceParams = (update: (p: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    update(params);
    const qs = params.toString();
    router.replace(qs ? `${BASE}?${qs}` : BASE, { scroll: false });
  };

  const setDetailId = (id: string | null) =>
    replaceParams((p) => {
      if (id) p.set('id', id);
      else p.delete('id');
    });

  useEffect(() => {
    if (!isNew) return;
    setPrefillApplicationId(searchParams.get('applicationId'));
    setEditing(null);
    setFormOpen(true);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('new');
    params.delete('applicationId');
    const qs = params.toString();
    router.replace(qs ? `${BASE}?${qs}` : BASE, { scroll: false });
  }, [isNew, searchParams, router]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, jobId, clientId]);

  const filters = useMemo(
    () => ({
      ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
      ...(jobId !== ALL ? { jobId } : {}),
      ...(clientId !== ALL ? { clientId } : {}),
    }),
    [debouncedSearch, jobId, clientId],
  );

  const params = useMemo(
    () => ({
      page,
      limit: LIMIT,
      ...filters,
      ...(status !== ALL ? { status: status as OfferStatus } : {}),
    }),
    [page, filters, status],
  );

  const { data, isLoading, isError, error, isFetching } =
    useOffersQuery(params);
  const counts = useOfferStatusCounts(filters);
  const { data: jobsData } = useJobsQuery({ page: 1, limit: 100 });
  const { data: clientsData } = useClientsQuery({ page: 1, limit: 100 });
  const detailQuery = useOfferQuery(detailId);

  useEffect(() => {
    if (isError) toast.error('Could not load offers', errorMessage(error));
  }, [isError, error]);

  const rows = data?.data ?? [];
  const detail =
    detailQuery.data ?? rows.find((r) => r.id === detailId) ?? null;

  const decided = (counts.accepted ?? 0) + (counts.declined ?? 0);
  const acceptance = decided
    ? Math.round(((counts.accepted ?? 0) / decided) * 100)
    : null;
  const totalAll = OFFER_STATUSES.reduce((s, k) => s + (counts[k] ?? 0), 0);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (offer: Offer) => {
    setEditing(offer);
    setFormOpen(true);
  };

  const columns: DataGridColumn<Offer>[] = [
    {
      key: 'candidate',
      header: 'Candidate',
      width: 200,
      render: (r) => (
        <span className="flex items-center gap-2">
          <InitialsAvatar
            name={candidateName(r)}
            className="h-6 w-6 text-[10px]"
          />
          <span className="truncate font-medium">{candidateName(r)}</span>
        </span>
      ),
    },
    {
      key: 'job',
      header: 'Job',
      width: 220,
      render: (r) => (
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate">{r.job.title}</span>
          <span className="truncate text-xs text-muted-foreground">
            {r.client?.name ?? 'No client'}
          </span>
        </span>
      ),
    },
    {
      key: 'salary',
      header: 'Salary',
      width: 180,
      align: 'right',
      mono: true,
      render: (r) => offerSalary(r, fmt),
    },
    {
      key: 'startDate',
      header: 'Start date',
      width: 110,
      mono: true,
      render: (r) => (r.startDate ? fmt.date(r.startDate) : ''),
    },
    {
      key: 'approvers',
      header: 'Approvers',
      width: 150,
      render: (r) =>
        r.approvers.length === 0 ? (
          <span className="text-muted-foreground">None</span>
        ) : (
          <span className="flex items-center gap-2">
            <span className="flex -space-x-1">
              {r.approvers.slice(0, 4).map((a) => (
                <span
                  key={a.id}
                  title={`${approverName(a)}: ${a.decision ?? 'pending'}`}
                  className={cn(
                    'rounded-full ring-2',
                    DECISION_RING[a.decision ?? 'pending'],
                  )}
                >
                  <InitialsAvatar
                    name={approverName(a)}
                    className="h-5 w-5 text-[9px]"
                  />
                </span>
              ))}
            </span>
            <span className="text-xs tabular-nums text-muted-foreground">
              {approvalSummary(r)}
            </span>
          </span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      width: 150,
      render: (r) => (
        <StatusPill tone={OFFER_STATUS_TONE[r.status]} dot>
          {OFFER_STATUS_LABEL[r.status]}
        </StatusPill>
      ),
    },
    {
      key: 'updated',
      header: 'Updated',
      width: 110,
      mono: true,
      render: (r) => fmt.relative(r.updatedAt),
    },
  ];

  const exportRows = () =>
    downloadCsv('offers', rows, [
      { header: 'Candidate', value: (r) => candidateName(r) },
      { header: 'Email', value: (r) => r.candidate.email },
      { header: 'Offer title', value: (r) => r.title },
      { header: 'Job', value: (r) => r.job.title },
      { header: 'Client', value: (r) => r.client?.name ?? '' },
      { header: 'Salary', value: (r) => offerSalary(r, fmt) },
      { header: 'Currency', value: (r) => r.currency },
      { header: 'Bonus', value: (r) => r.bonus ?? '' },
      { header: 'Equity', value: (r) => r.equity ?? '' },
      { header: 'Start date', value: (r) => fmt.date(r.startDate) },
      { header: 'Expires', value: (r) => fmt.date(r.expiresAt) },
      { header: 'Approvals', value: (r) => approvalSummary(r) },
      { header: 'Status', value: (r) => OFFER_STATUS_LABEL[r.status] },
      { header: 'Updated', value: (r) => fmt.date(r.updatedAt) },
    ]);

  const hasFilters =
    !!debouncedSearch.trim() ||
    status !== ALL ||
    jobId !== ALL ||
    clientId !== ALL;

  return (
    <div className="-m-4 flex h-[calc(100vh-6rem)] flex-col gap-3 p-4">
      <StatTileRow>
        <StatTile
          label="Offers out"
          value={counts.sent ?? '-'}
          className="p-4"
        />
        <StatTile
          label="Awaiting approval"
          value={counts.pending_approval ?? '-'}
          tone={counts.pending_approval ? 'warning' : 'default'}
          className="p-4"
        />
        <StatTile
          label="Acceptance rate"
          value={acceptance ?? '-'}
          unit={
            acceptance === null ? 'no decided offers' : '% of decided offers'
          }
          tone="positive"
          className="p-4"
        />
        <StatTile label="Drafts" value={counts.draft ?? '-'} className="p-4" />
      </StatTileRow>

      <FilterBar
        end={
          <>
            <ExportButton formats={['CSV']} onExport={exportRows} />
            <PermissionGuard permissions={PERMISSIONS_ENUM.OFFER_CREATE}>
              <ToolbarButton
                variant="primary"
                icon={FilePlus2}
                onClick={openNew}
              >
                New offer
              </ToolbarButton>
            </PermissionGuard>
          </>
        }
      >
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search offers..."
        />
        <FilterDropdown
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { label: `All (${totalAll})`, value: ALL },
            ...OFFER_STATUSES.map((s) => ({
              label: `${OFFER_STATUS_LABEL[s]} (${counts[s] ?? 0})`,
              value: s,
            })),
          ]}
        />
        <FilterDropdown
          label="Job"
          value={jobId}
          onChange={setJobId}
          options={[
            { label: 'All', value: ALL },
            ...(jobsData?.data ?? []).map((j) => ({
              label: j.title,
              value: j.id,
            })),
          ]}
        />
        <FilterDropdown
          label="Client"
          value={clientId}
          onChange={setClientId}
          options={[
            { label: 'All', value: ALL },
            ...(clientsData?.data ?? []).map((c) => ({
              label: c.name,
              value: c.id,
            })),
          ]}
        />
      </FilterBar>

      <div className="flex min-h-0 flex-1 flex-col">
        {isLoading ? (
          <TableSkeleton />
        ) : rows.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-md border border-border">
            <EmptyState
              icon={<FileSignature className="h-8 w-8" />}
              title={
                hasFilters ? 'No offers match these filters' : 'No offers yet'
              }
              description={
                hasFilters
                  ? 'Try a different search or clear the filters'
                  : 'Draft an offer for a candidate in your pipeline'
              }
              action={
                !hasFilters && (
                  <PermissionGuard permissions={PERMISSIONS_ENUM.OFFER_CREATE}>
                    <ToolbarButton
                      variant="primary"
                      icon={FilePlus2}
                      onClick={openNew}
                    >
                      New offer
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

      <OfferFormDrawer
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setPrefillApplicationId(null);
        }}
        offer={editing}
        initialApplicationId={prefillApplicationId}
        onSaved={(offer) => {
          if (!editing) setDetailId(offer.id);
        }}
      />

      <OfferDetailDrawer
        open={!!detailId && !formOpen}
        onOpenChange={(o) => !o && setDetailId(null)}
        offer={detail}
        loading={detailQuery.isLoading}
        onEdit={openEdit}
        onDeleted={() => setDetailId(null)}
      />
    </div>
  );
}

export default function OffersPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <OffersPageContent />
    </Suspense>
  );
}
