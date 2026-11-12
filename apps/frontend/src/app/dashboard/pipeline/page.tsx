'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  Archive,
  Columns3,
  Filter,
  KanbanSquare,
  List,
  RotateCcw,
  UserPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { InitialsAvatar } from '@/components/ui/initials-avatar';
import {
  DataGrid,
  DetailDrawer,
  EmptyState,
  FilterBar,
  FilterDropdown,
  MultiFilter,
  NotIntegratedBadge,
  RatingStars,
  SearchInput,
  SegmentedControl,
  StatusPill,
  ToolbarButton,
  type DataGridColumn,
} from '@/components/patterns';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { usePermissions } from '@/hooks/use-permissions';
import { useDebounce } from '@/hooks/use-debounce';
import {
  PERMISSION_BASE,
  PERMISSIONS_ENUM,
} from '@/constants/permissions.constants';
import {
  applicationsKeys,
  useApplicationBoardQuery,
  useClientsQuery,
  useJobQuery,
  useJobsQuery,
  useUpdateApplicationStageMutation,
} from '@/hooks/queries';
import { AddCandidateDrawer } from '@/components/candidates/add-candidate-drawer';
import { CandidateDetailDrawer } from '@/components/candidates/candidate-detail-drawer';
import { useUserNamesQuery } from '@/hooks/queries';
import { RejectApplicationDialog } from '@/components/applications/reject-application-dialog';
import {
  PipelineBoard,
  PipelineBoardSkeleton,
} from '@/components/pipeline/pipeline-board';
import { JobSummary } from '@/components/pipeline/job-summary';
import { AgentScore, SourceBadge } from '@/components/pipeline/pipeline-card';
import {
  SAMPLE_NEXT_STEP,
  boardCards,
  daysInStage,
  flowStageDefs,
  moveCardInBoard,
  sampleMatchScore,
  slaState,
  type PipelineCandidate,
} from '@/components/pipeline/pipeline-data';
import {
  CATEGORY_TONE,
  SOURCE_LABEL,
  errorMessage,
  isClosedCategory,
  userLabel,
} from '@/components/applications/application-meta';
import type {
  ApplicationBoard,
  ApplicationBoardRequest,
  ApplicationStage,
  StageCounts,
} from '@/types/application.type';
import { CANDIDATE_SOURCES } from '@/types/candidate.type';

type View = 'board' | 'list';

const ALL = 'all';

const columns: DataGridColumn<PipelineCandidate>[] = [
  {
    key: 'name',
    header: 'Candidate',
    width: 220,
    render: (r) => (
      <span className="flex items-center gap-2">
        <InitialsAvatar
          name={r.candidateName}
          className="h-6 w-6 text-[10px]"
        />
        <span className="block truncate font-medium">{r.candidateName}</span>
      </span>
    ),
  },
  {
    key: 'headline',
    header: 'Headline',
    width: 220,
    render: (r) => r.candidateHeadline ?? '-',
  },
  {
    key: 'job',
    header: 'Job',
    width: 220,
    render: (r) => (
      <span className="block truncate">
        {r.jobTitle}
        {r.clientName && (
          <span className="text-muted-foreground">, {r.clientName}</span>
        )}
      </span>
    ),
  },
  {
    key: 'stage',
    header: 'Stage',
    width: 130,
    render: (r) => (
      <StatusPill tone={CATEGORY_TONE[r.stageCategory]} dot>
        {r.stageName}
      </StatusPill>
    ),
  },
  {
    key: 'source',
    header: 'Source',
    width: 140,
    render: (r) => <SourceBadge source={r.source} />,
  },
  {
    key: 'rating',
    header: 'Rating',
    width: 110,
    render: (r) =>
      r.rating ? (
        <RatingStars value={r.rating} size={12} />
      ) : (
        <span className="text-muted-foreground">-</span>
      ),
  },
  {
    key: 'agentScore',
    header: 'Match',
    width: 90,
    render: (r) => <AgentScore score={sampleMatchScore(r.id)} />,
  },
  {
    key: 'daysInStage',
    header: 'In stage',
    width: 90,
    align: 'right',
    render: (r) => {
      const sla = slaState(r);
      return (
        <span
          className={cn(
            'tabular-nums',
            sla === 'over' && 'font-semibold text-red-600 dark:text-red-400',
            sla === 'warn' && 'text-amber-600 dark:text-amber-400',
          )}
        >
          {daysInStage(r)}d
        </span>
      );
    },
  },
  {
    key: 'nextStep',
    header: 'Next step',
    width: 180,
    render: (r) => (
      <span className="text-muted-foreground">
        {SAMPLE_NEXT_STEP[r.stageCategory]}
      </span>
    ),
  },
  {
    key: 'shortlisted',
    header: 'Shortlisted',
    width: 100,
    render: (r) => (r.shortlisted ? 'Yes' : '-'),
  },
];

function PipelineView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const { hasPermission } = usePermissions();

  const jobId = searchParams.get('jobId') ?? ALL;
  const [clientId, setClientId] = useState(ALL);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [sources, setSources] = useState<string[]>([]);
  const [owner, setOwner] = useState(ALL);
  const [view, setView] = useState<View>('board');
  const [detail, setDetail] = useState<{
    candidateId: string;
    applicationId: string;
  } | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [rejectedOpen, setRejectedOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const canList = hasPermission(PERMISSIONS_ENUM.APPLICATION_LIST_READ);
  const canMove = hasPermission(PERMISSIONS_ENUM.APPLICATION_UPDATE);

  const params = useMemo<ApplicationBoardRequest>(
    () => ({
      limitPerStage: 100,
      ...(jobId !== ALL && { jobId }),
      ...(clientId !== ALL && { clientId }),
      ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
    }),
    [jobId, clientId, debouncedSearch],
  );

  const {
    data: board,
    isLoading,
    isError,
    error,
  } = useApplicationBoardQuery(params, canList);
  const { data: jobsData } = useJobsQuery(
    { page: 1, limit: 100 },
    hasPermission(PERMISSIONS_ENUM.JOB_LIST_READ),
  );
  const { data: job } = useJobQuery(jobId !== ALL ? jobId : null);
  const { data: clientsData } = useClientsQuery(
    { page: 1, limit: 100 },
    hasPermission(PERMISSIONS_ENUM.CLIENT_LIST_READ),
  );
  const { data: users = [] } = useUserNamesQuery(
    hasPermission(PERMISSION_BASE.USER_LIST_READ),
  );
  const updateStage = useUpdateApplicationStageMutation();

  useEffect(() => {
    if (isError) toast.error('Could not load the pipeline', error?.message);
  }, [isError, error]);

  const selectJob = (id: string) => {
    setDetail(null);
    const next = new URLSearchParams(searchParams.toString());
    if (id === ALL) next.delete('jobId');
    else next.set('jobId', id);
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const filter = useCallback(
    (c: PipelineCandidate) =>
      (sources.length === 0 || sources.includes(c.source)) &&
      (owner === ALL || c.ownerId === owner),
    [sources, owner],
  );

  const flowStages = useMemo(() => flowStageDefs(board), [board]);
  const columnByKey = useMemo(
    () => new Map((board?.stages ?? []).map((s) => [s.stage, s])),
    [board],
  );
  const initialKey = board?.stages.find((s) => s.category === 'applied')?.stage;
  const rejectKey = board?.stages.find((s) => s.category === 'rejected')?.stage;

  const all = useMemo(() => boardCards(board), [board]);
  const active = useMemo(
    () => all.filter((c) => !isClosedCategory(c.stageCategory) && filter(c)),
    [all, filter],
  );
  const closed = useMemo(
    () => all.filter((c) => isClosedCategory(c.stageCategory) && filter(c)),
    [all, filter],
  );

  const counts = useMemo<StageCounts>(
    () =>
      Object.fromEntries((board?.stages ?? []).map((s) => [s.stage, s.count])),
    [board],
  );
  const closedCount = (board?.stages ?? [])
    .filter((s) => isClosedCategory(s.category))
    .reduce((n, s) => n + s.count, 0);

  const doMove = async (
    id: string,
    stage: ApplicationStage,
    rejectionReason?: string,
  ) => {
    const card = all.find((c) => c.id === id);
    if (!card || card.stage === stage) return;
    const key = applicationsKeys.board(params);
    await qc.cancelQueries({ queryKey: key });
    const snapshot = qc.getQueryData<ApplicationBoard>(key);
    if (snapshot) qc.setQueryData(key, moveCardInBoard(snapshot, id, stage));
    try {
      await updateStage.mutateAsync({
        id,
        data: { stage, ...(rejectionReason && { rejectionReason }) },
      });
      toast.success(
        `${card.candidateName} moved to ${columnByKey.get(stage)?.name ?? stage}`,
      );
    } catch (err) {
      if (snapshot) qc.setQueryData(key, snapshot);
      toast.error('Could not move candidate', errorMessage(err));
      throw err;
    }
  };

  const move = (id: string, stage: ApplicationStage) => {
    if (columnByKey.get(stage)?.category === 'rejected') {
      setRejectingId(id);
      return;
    }
    doMove(id, stage).catch(() => undefined);
  };

  const rejectingCard = all.find((c) => c.id === rejectingId) ?? null;

  const detailList = active;
  const detailIndex = detail
    ? detailList.findIndex((c) => c.id === detail.applicationId)
    : -1;
  const openCard = (c: PipelineCandidate) =>
    setDetail({ candidateId: c.candidateId, applicationId: c.id });

  const toggleSource = (v: string) =>
    setSources((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));

  const jobs = jobsData?.data ?? [];
  const showJob = jobId === ALL;

  return (
    <div className="-m-4 flex h-[calc(100vh-6rem)] flex-col gap-3 p-4">
      <FilterBar
        end={
          <>
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              Match and next step
              <NotIntegratedBadge />
            </span>
            <SegmentedControl
              value={view}
              onChange={setView}
              options={[
                {
                  value: 'board',
                  label: 'Board',
                  icon: <Columns3 className="h-3.5 w-3.5" />,
                },
                {
                  value: 'list',
                  label: 'List',
                  icon: <List className="h-3.5 w-3.5" />,
                },
              ]}
            />
            <PermissionGuard permissions={PERMISSIONS_ENUM.CANDIDATE_CREATE}>
              <ToolbarButton
                variant="primary"
                icon={UserPlus}
                onClick={() => setAddOpen(true)}
              >
                Add candidate
              </ToolbarButton>
            </PermissionGuard>
          </>
        }
      >
        <FilterDropdown
          label="Job"
          value={jobId}
          options={[
            { label: 'All jobs', value: ALL },
            ...jobs.map((j) => ({ label: j.title, value: j.id })),
            ...(jobId !== ALL && job && !jobs.some((j) => j.id === jobId)
              ? [{ label: job.title, value: job.id }]
              : []),
          ]}
          onChange={selectJob}
        />
        <FilterDropdown
          label="Client"
          value={clientId}
          options={[
            { label: 'All clients', value: ALL },
            ...(clientsData?.data ?? []).map((c) => ({
              label: c.name,
              value: c.id,
            })),
          ]}
          onChange={setClientId}
        />
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search candidates..."
        />
        <MultiFilter
          label="Source"
          icon={Filter}
          selected={sources}
          onToggle={toggleSource}
          options={CANDIDATE_SOURCES.map((s) => ({
            label: SOURCE_LABEL[s],
            value: s,
          }))}
        />
        <FilterDropdown
          label="Owner"
          value={owner}
          options={[
            { label: 'Anyone', value: ALL },
            ...users.map((u) => ({ label: userLabel(u), value: u.id })),
          ]}
          onChange={setOwner}
        />
      </FilterBar>

      <PermissionGuard
        permissions={PERMISSIONS_ENUM.APPLICATION_LIST_READ}
        fallback={
          <EmptyState
            className="flex-1"
            title="You do not have access to the pipeline"
            description="Ask an admin to grant you the application list permission"
          />
        }
      >
        <JobSummary
          job={jobId !== ALL ? (job ?? null) : null}
          stages={flowStages}
          counts={counts}
          closed={closedCount}
          jobCount={jobsData?.total ?? jobs.length}
        />

        {isLoading || !board ? (
          isError ? (
            <EmptyState
              className="flex-1"
              title="Could not load the pipeline"
            />
          ) : (
            <PipelineBoardSkeleton />
          )
        ) : all.length === 0 ? (
          <EmptyState
            className="flex-1 rounded-lg border border-border"
            icon={<KanbanSquare className="h-5 w-5" />}
            title={
              debouncedSearch || clientId !== ALL
                ? 'No applications match'
                : 'No applications yet'
            }
            description="Add candidates to a job to see them move through the stages"
          />
        ) : view === 'board' ? (
          <PipelineBoard
            board={board}
            filter={filter}
            rejectedCount={closedCount}
            canMove={canMove}
            showJob={showJob}
            onOpenRejected={() => setRejectedOpen(true)}
            onMove={move}
            onReject={(id) => setRejectingId(id)}
            onOpen={openCard}
          />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <DataGrid
              columns={columns}
              rows={active}
              getRowId={(r) => r.id}
              onRowClick={openCard}
              pinFirstColumn
              maxHeight="100%"
              className="flex-1"
            />
            <div className="flex items-center justify-between border border-t-0 border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              <span>
                Showing {active.length} of{' '}
                {flowStages.reduce((n, s) => n + (counts[s.id] ?? 0), 0)} active
                applications
              </span>
            </div>
          </div>
        )}
      </PermissionGuard>

      <AddCandidateDrawer
        open={addOpen}
        onOpenChange={setAddOpen}
        defaultJobId={jobId !== ALL ? jobId : undefined}
      />

      <RejectApplicationDialog
        open={rejectingId !== null}
        onOpenChange={(o) => !o && setRejectingId(null)}
        candidateName={rejectingCard?.candidateName}
        onConfirm={async (reason) => {
          if (rejectingId && rejectKey) {
            await doMove(rejectingId, rejectKey, reason);
          }
        }}
      />

      <DetailDrawer
        open={rejectedOpen}
        onOpenChange={setRejectedOpen}
        title="Rejected and archived"
        chips={<StatusPill tone="neutral">{closedCount}</StatusPill>}
      >
        <div className="space-y-4">
          {closed.length === 0 ? (
            <EmptyState
              icon={<Archive className="h-5 w-5" />}
              compact
              title="Nothing rejected or withdrawn"
              description="Candidates you reject from the board appear here so you can restore them"
            />
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border">
              {closed.map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-3 py-2.5">
                  <InitialsAvatar
                    name={c.candidateName}
                    className="h-7 w-7 text-[11px]"
                  />
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => openCard(c)}
                  >
                    <p className="truncate text-sm font-medium">
                      {c.candidateName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.stageName} · {c.jobTitle}
                      {c.candidateHeadline ? ` · ${c.candidateHeadline}` : ''}
                    </p>
                  </button>
                  {canMove && initialKey && (
                    <ToolbarButton
                      icon={RotateCcw}
                      onClick={() =>
                        doMove(c.id, initialKey).catch(() => undefined)
                      }
                    >
                      Restore
                    </ToolbarButton>
                  )}
                </li>
              ))}
            </ul>
          )}
          {closedCount > closed.length && (
            <p className="text-xs text-muted-foreground">
              Showing {closed.length} of {closedCount}, restored candidates go
              back to applied
            </p>
          )}
        </div>
      </DetailDrawer>

      <CandidateDetailDrawer
        candidateId={detail?.candidateId ?? null}
        applicationId={detail?.applicationId ?? null}
        open={detail !== null}
        onOpenChange={(o) => !o && setDetail(null)}
        hasPrev={detailIndex > 0}
        hasNext={detailIndex >= 0 && detailIndex < detailList.length - 1}
        onPrev={() => detailIndex > 0 && openCard(detailList[detailIndex - 1])}
        onNext={() =>
          detailIndex >= 0 &&
          detailIndex < detailList.length - 1 &&
          openCard(detailList[detailIndex + 1])
        }
      />
    </div>
  );
}

export default function PipelinePage() {
  return (
    <Suspense
      fallback={
        <div className="-m-4 flex h-[calc(100vh-6rem)] flex-col gap-3 p-4">
          <PipelineBoardSkeleton />
        </div>
      }
    >
      <PipelineView />
    </Suspense>
  );
}
