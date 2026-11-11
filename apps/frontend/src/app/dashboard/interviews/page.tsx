'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CalendarDays,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Video,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { downloadCsv } from '@/lib/export-csv';
import type { Formatters } from '@/lib/format';
import { useFormatters } from '@/hooks/use-formatters';
import { usePermissions } from '@/hooks/use-permissions';
import { useBreadcrumb } from '@/contexts/breadcrumb-context';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';
import { useInterviewsQuery, useJobsQuery } from '@/hooks/queries';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { InitialsAvatar } from '@/components/ui/initials-avatar';
import { ListPageSkeleton } from '@/components/ui/list-page-skeleton';
import {
  AvatarStack,
  DataGrid,
  EmptyState,
  ExportButton,
  FilterBar,
  FilterDropdown,
  SearchInput,
  SegmentedControl,
  StatusPill,
  ToolbarButton,
  type DataGridColumn,
} from '@/components/patterns';
import {
  INTERVIEW_STATUS_LABEL,
  INTERVIEW_STATUS_TONE,
  INTERVIEW_TYPE_LABEL,
  candidateLabel,
  formatDuration,
  personLabel,
} from '@/components/interviews/interview-data';
import { ScheduleInterviewDrawer } from '@/components/interviews/schedule-interview-drawer';
import { InterviewDetailDrawer } from '@/components/interviews/interview-detail-drawer';
import type {
  Interview,
  InterviewStatus,
  ListInterviewsRequest,
} from '@/types/interview.type';

type View = 'upcoming' | 'feedback' | 'past';
type Owner = 'everyone' | 'mine';

const PAGE_SIZE = 25;
const ALL = 'all';

const PAST_STATUS_OPTIONS = [
  { value: ALL, label: 'Any' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No show' },
];

function viewParams(
  view: View,
  now: string,
  pastStatus: string,
): Partial<ListInterviewsRequest> {
  if (view === 'upcoming') return { from: now, status: 'scheduled' };
  if (view === 'feedback') return { needsFeedback: true };
  return pastStatus === ALL
    ? { to: now }
    : { status: pastStatus as InterviewStatus };
}

function CountBadge({
  value,
  active,
}: {
  value: number | undefined;
  active: boolean;
}) {
  return (
    <span
      className={cn(
        'order-last rounded px-1.5 text-[11px] font-semibold tabular-nums',
        active ? 'bg-[#3F6650] text-white' : 'bg-muted text-muted-foreground',
      )}
    >
      {value ?? '-'}
    </span>
  );
}

function LocationCell({ row }: { row: Interview }) {
  if (row.meetingUrl) {
    return (
      <a
        href={row.meetingUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="inline-flex max-w-full items-center gap-1.5 text-[#3F6650] hover:underline dark:text-[#8FBFA1]"
      >
        <Video className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">Meeting link</span>
      </a>
    );
  }
  if (row.location) {
    return (
      <span className="inline-flex max-w-full items-center gap-1.5 text-muted-foreground">
        <MapPin className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{row.location}</span>
      </span>
    );
  }
  return <span className="text-muted-foreground">Not set</span>;
}

function FeedbackCell({ row }: { row: Interview }) {
  const total = row.interviewerCount;
  if (row.status === 'cancelled' || total === 0) {
    return <span className="text-muted-foreground">-</span>;
  }
  const done = Math.min(row.scorecardCount, total);
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-1.5 w-10 overflow-hidden rounded-sm bg-muted">
        <span
          className={cn(
            'block h-full',
            done >= total ? 'bg-[#3F6650]' : 'bg-amber-500',
          )}
          style={{ width: `${(done / total) * 100}%` }}
        />
      </span>
      <span className="tabular-nums text-muted-foreground">
        {done}/{total}
      </span>
      {row.averageRating !== null && (
        <span className="tabular-nums text-xs font-medium">
          {row.averageRating.toFixed(1)}
        </span>
      )}
    </span>
  );
}

function StatusCell({ row }: { row: Interview }) {
  if (row.feedbackDue) {
    return (
      <StatusPill tone="warning" dot>
        Feedback due
      </StatusPill>
    );
  }
  return (
    <StatusPill tone={INTERVIEW_STATUS_TONE[row.status]} dot>
      {INTERVIEW_STATUS_LABEL[row.status]}
    </StatusPill>
  );
}

function buildColumns(fmt: Formatters): DataGridColumn<Interview>[] {
  return [
    {
      key: 'candidate',
      header: 'Candidate',
      width: 200,
      render: (r) => (
        <span className="flex items-center gap-2">
          <InitialsAvatar
            name={candidateLabel(r)}
            className="h-6 w-6 text-[10px]"
          />
          <span className="truncate font-medium">{candidateLabel(r)}</span>
        </span>
      ),
    },
    {
      key: 'job',
      header: 'Job',
      width: 210,
      render: (r) => (
        <span className="block min-w-0">
          <span className="block truncate">{r.job.title}</span>
          {r.client && (
            <span className="block truncate text-xs text-muted-foreground">
              {r.client.name}
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'interview',
      header: 'Interview',
      width: 170,
      render: (r) => (
        <span className="block min-w-0">
          <span className="block truncate">{r.title}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {INTERVIEW_TYPE_LABEL[r.type]}
          </span>
        </span>
      ),
    },
    {
      key: 'when',
      header: 'When',
      width: 170,
      render: (r) => (
        <span className="tabular-nums">
          {fmt.dateLong(r.scheduledAt, {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          })}{' '}
          <span className="text-muted-foreground">
            · {fmt.time(r.scheduledAt)}
          </span>
        </span>
      ),
    },
    {
      key: 'length',
      header: 'Length',
      width: 90,
      mono: true,
      render: (r) => formatDuration(r.durationMinutes),
    },
    {
      key: 'location',
      header: 'Location',
      width: 150,
      render: (r) => <LocationCell row={r} />,
    },
    {
      key: 'panel',
      header: 'Panel',
      width: 110,
      render: (r) => (
        <AvatarStack
          items={r.interviewers.map((i) => ({ name: personLabel(i) }))}
          max={3}
          size={22}
        />
      ),
    },
    {
      key: 'scorecards',
      header: 'Scorecards',
      width: 140,
      render: (r) => <FeedbackCell row={r} />,
    },
    {
      key: 'status',
      header: 'Status',
      width: 130,
      render: (r) => <StatusCell row={r} />,
    },
  ];
}

function InterviewsContent() {
  useBreadcrumb([{ label: 'Interviews', active: true }]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const fmt = useFormatters();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(PERMISSIONS_ENUM.INTERVIEW_CREATE);

  const [now] = useState(() => new Date().toISOString());
  const [view, setView] = useState<View>('upcoming');
  const [owner, setOwner] = useState<Owner>('everyone');
  const [jobId, setJobId] = useState<string>(ALL);
  const [pastStatus, setPastStatus] = useState<string>(ALL);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Interview | null>(null);
  const [prefillApplicationId, setPrefillApplicationId] = useState<
    string | null
  >(null);

  useEffect(() => {
    const isNew = searchParams.get('new') === '1';
    const id = searchParams.get('id');
    if (!isNew && !id) return;
    if (isNew) {
      setEditing(null);
      setPrefillApplicationId(searchParams.get('applicationId'));
      setFormOpen(true);
    }
    if (id) setDetailId(id);
    router.replace('/dashboard/interviews', { scroll: false });
  }, [searchParams, router]);

  const base = useMemo<Partial<ListInterviewsRequest>>(
    () => ({
      ...(owner === 'mine' && { mine: true }),
      ...(jobId !== ALL && { jobId }),
    }),
    [owner, jobId],
  );

  const params = useMemo<ListInterviewsRequest>(
    () => ({
      page,
      limit: PAGE_SIZE,
      ...base,
      ...viewParams(view, now, pastStatus),
    }),
    [page, base, view, now, pastStatus],
  );

  const { data, isLoading, isFetching, isError, error } =
    useInterviewsQuery(params);
  const countParams = (v: View): ListInterviewsRequest => ({
    page: 1,
    limit: 1,
    ...base,
    ...viewParams(v, now, ALL),
  });
  const upcomingCount = useInterviewsQuery(countParams('upcoming'));
  const feedbackCount = useInterviewsQuery(countParams('feedback'));
  const pastCount = useInterviewsQuery(countParams('past'));
  const { data: jobsData } = useJobsQuery(
    { page: 1, limit: 100 },
    hasPermission(PERMISSIONS_ENUM.JOB_LIST_READ),
  );

  const columns = useMemo(() => buildColumns(fmt), [fmt]);

  useEffect(() => {
    setPage(1);
  }, [view, owner, jobId, pastStatus]);

  useEffect(() => {
    if (isError) toast.error('Could not load interviews', error?.message);
  }, [isError, error]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = data?.data ?? [];
    if (!q) return list;
    return list.filter((i) =>
      [candidateLabel(i), i.job.title, i.client?.name ?? '', i.title]
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [data, search]);

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, data?.totalPages ?? 1);
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  const jobOptions = useMemo(
    () => [
      { value: ALL, label: 'All roles' },
      ...(jobsData?.data ?? []).map((j) => ({
        value: j.id,
        label: j.client ? `${j.title}, ${j.client.name}` : j.title,
      })),
    ],
    [jobsData],
  );

  const openSchedule = () => {
    setEditing(null);
    setPrefillApplicationId(null);
    setFormOpen(true);
  };

  const openEdit = (interview: Interview) => {
    setEditing(interview);
    setPrefillApplicationId(null);
    setDetailId(null);
    setFormOpen(true);
  };

  const handleExport = () => {
    downloadCsv(`interviews-${view}`, rows, [
      { header: 'Candidate', value: (r) => candidateLabel(r) },
      { header: 'Job', value: (r) => r.job.title },
      { header: 'Client', value: (r) => r.client?.name ?? '' },
      { header: 'Interview', value: (r) => r.title },
      { header: 'Type', value: (r) => INTERVIEW_TYPE_LABEL[r.type] },
      { header: 'Date', value: (r) => fmt.date(r.scheduledAt) },
      { header: 'Time', value: (r) => fmt.time(r.scheduledAt) },
      { header: 'Length', value: (r) => formatDuration(r.durationMinutes) },
      { header: 'Location', value: (r) => r.location ?? '' },
      { header: 'Meeting link', value: (r) => r.meetingUrl ?? '' },
      {
        header: 'Panel',
        value: (r) => r.interviewers.map(personLabel).join('; '),
      },
      {
        header: 'Scorecards',
        value: (r) => `${r.scorecardCount}/${r.interviewerCount}`,
      },
      {
        header: 'Average rating',
        value: (r) =>
          r.averageRating !== null ? r.averageRating.toFixed(1) : '',
      },
      { header: 'Status', value: (r) => INTERVIEW_STATUS_LABEL[r.status] },
    ]);
    toast.success(
      'Export ready',
      `${rows.length} interviews downloaded as CSV`,
    );
  };

  if (isLoading && !data) {
    return <ListPageSkeleton filters={4} />;
  }

  return (
    <div className="-m-4 flex h-[calc(100vh-6rem)] flex-col gap-3 p-4">
      <FilterBar
        end={
          <>
            <ExportButton formats={['CSV']} onExport={handleExport} />
            {canCreate && (
              <ToolbarButton
                variant="primary"
                icon={CalendarPlus}
                onClick={openSchedule}
              >
                Schedule interview
              </ToolbarButton>
            )}
          </>
        }
      >
        <SegmentedControl
          value={view}
          onChange={setView}
          options={[
            {
              value: 'upcoming',
              label: 'Upcoming',
              icon: (
                <CountBadge
                  value={upcomingCount.data?.total}
                  active={view === 'upcoming'}
                />
              ),
            },
            {
              value: 'feedback',
              label: 'Needs feedback',
              icon: (
                <CountBadge
                  value={feedbackCount.data?.total}
                  active={view === 'feedback'}
                />
              ),
            },
            {
              value: 'past',
              label: 'Past',
              icon: (
                <CountBadge
                  value={pastCount.data?.total}
                  active={view === 'past'}
                />
              ),
            },
          ]}
        />
        <SegmentedControl
          value={owner}
          onChange={setOwner}
          options={[
            { value: 'everyone', label: 'Everyone' },
            { value: 'mine', label: 'Mine' },
          ]}
        />
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search candidate or role..."
        />
        <FilterDropdown
          label="Role"
          value={jobId}
          options={jobOptions}
          onChange={setJobId}
        />
        {view === 'past' && (
          <FilterDropdown
            label="Status"
            value={pastStatus}
            options={PAST_STATUS_OPTIONS}
            onChange={setPastStatus}
          />
        )}
      </FilterBar>

      <div className="flex min-h-0 flex-1 flex-col">
        {rows.length === 0 && !isFetching ? (
          <div className="flex flex-1 items-center justify-center rounded-t-md border border-border bg-card">
            <EmptyState
              icon={<CalendarDays className="h-8 w-8" />}
              title={
                search.trim()
                  ? 'No interviews match your search'
                  : view === 'upcoming'
                    ? 'No upcoming interviews'
                    : view === 'feedback'
                      ? 'All feedback is in'
                      : 'No past interviews'
              }
              description={
                view === 'upcoming' && !search.trim()
                  ? 'Schedule one from here or from a candidate profile'
                  : undefined
              }
              action={
                canCreate && view === 'upcoming' && !search.trim() ? (
                  <ToolbarButton
                    variant="primary"
                    icon={CalendarPlus}
                    onClick={openSchedule}
                  >
                    Schedule interview
                  </ToolbarButton>
                ) : undefined
              }
            />
          </div>
        ) : (
          <DataGrid
            columns={columns}
            rows={rows}
            getRowId={(r) => r.id}
            onRowClick={(r) => setDetailId(r.id)}
            pinFirstColumn
            maxHeight="100%"
            className="flex-1"
          />
        )}
        <div className="flex items-center justify-between border border-t-0 border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <span>
            {isFetching && !isLoading
              ? 'Updating...'
              : search.trim()
                ? `${rows.length} matches on this page of ${total}`
                : `Showing ${from}-${to} of ${total}`}
          </span>
          <span className="flex items-center gap-2">
            {view === 'feedback' && (
              <span className="mr-2 hidden sm:inline">
                Scorecards are due once the interview ends
              </span>
            )}
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              aria-label="Previous page"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex h-6 w-6 items-center justify-center rounded border border-border bg-background hover:bg-accent disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label="Next page"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="flex h-6 w-6 items-center justify-center rounded border border-border bg-background hover:bg-accent disabled:opacity-40"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </span>
        </div>
      </div>

      <ScheduleInterviewDrawer
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) {
            setEditing(null);
            setPrefillApplicationId(null);
          }
        }}
        interview={editing}
        applicationId={prefillApplicationId}
        onSaved={(saved) => {
          if (!editing && saved.scheduledAt >= now) setView('upcoming');
        }}
      />

      <InterviewDetailDrawer
        interviewId={detailId}
        open={detailId !== null}
        onOpenChange={(o) => !o && setDetailId(null)}
        onEdit={openEdit}
      />
    </div>
  );
}

export default function InterviewsPage() {
  return (
    <PermissionGuard
      permissions={PERMISSIONS_ENUM.INTERVIEW_LIST_READ}
      fallback={
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          You don&apos;t have permission to view interviews
        </div>
      }
    >
      <Suspense fallback={<ListPageSkeleton filters={4} />}>
        <InterviewsContent />
      </Suspense>
    </PermissionGuard>
  );
}
