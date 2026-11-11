'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Filter,
  UserPlus,
  Trash2,
  ArrowRightLeft,
  Tag,
  Users,
  Globe,
  Briefcase,
  Building2,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import {
  FilterBar,
  FilterDropdown,
  SearchInput,
  MultiFilter,
  ExportButton,
  ToolbarButton,
  SelectionBar,
  DataGrid,
  ColumnChooser,
  StatusPill,
  RatingStars,
  EmptyState,
  type DataGridColumn,
} from '@/components/patterns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { InitialsAvatar } from '@/components/ui/initials-avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/lib/toast';
import { downloadCsv } from '@/lib/export-csv';
import { useDebounce } from '@/hooks/use-debounce';
import { usePermissions } from '@/hooks/use-permissions';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';
import {
  useCandidatesQuery,
  useJobsQuery,
  useUpdateApplicationStageMutation,
  useUpdateCandidateMutation,
} from '@/hooks/queries';
import { AddCandidateDrawer } from '@/components/candidates/add-candidate-drawer';
import { CandidateDetailDrawer } from '@/components/candidates/candidate-detail-drawer';
import { RejectApplicationDialog } from '@/components/applications/reject-application-dialog';
import {
  ACTIVE_STAGES,
  RIGHT_TO_WORK_LABEL,
  RIGHT_TO_WORK_TONE,
  SOURCE_LABEL,
  STAGE_LABEL,
  STAGE_TONE,
  shortDate,
  userLabel,
} from '@/components/applications/application-meta';
import { LinkedInIcon } from '@/components/icons/brand-icons';
import {
  CANDIDATE_SOURCES,
  type CandidateListItem,
  type CandidateSource,
  type ListCandidatesRequest,
} from '@/types/candidate.type';
import {
  APPLICATION_STAGES,
  type ApplicationStage,
} from '@/types/application.type';

const SOURCE_ICON: Partial<
  Record<CandidateSource, { icon: LucideIcon; color: string }>
> = {
  referral: { icon: Users, color: '#3F6650' },
  careers_page: { icon: Globe, color: '#8B7DD8' },
  indeed: { icon: Briefcase, color: '#2164F3' },
  reed: { icon: Briefcase, color: '#C4122F' },
  totaljobs: { icon: Briefcase, color: '#0A66C2' },
  cv_library: { icon: Briefcase, color: '#E0533D' },
  agency_database: { icon: Building2, color: '#E0A458' },
};

function SourceIcon({ source }: { source: CandidateSource }) {
  if (source === 'linkedin') return <LinkedInIcon className="h-3.5 w-3.5" />;
  const meta = SOURCE_ICON[source];
  if (!meta) return null;
  const Icon = meta.icon;
  return <Icon className="h-3.5 w-3.5" style={{ color: meta.color }} />;
}

const fullName = (c: CandidateListItem) => `${c.firstName} ${c.lastName}`;

const columns: DataGridColumn<CandidateListItem>[] = [
  {
    key: 'name',
    header: 'Candidate',
    width: 210,
    render: (r) => (
      <span className="flex min-w-0 items-center gap-2">
        <InitialsAvatar
          name={fullName(r)}
          className="h-6 w-6 shrink-0 text-[10px]"
        />
        <span className="truncate font-medium">{fullName(r)}</span>
      </span>
    ),
  },
  {
    key: 'role',
    header: 'Current role',
    width: 210,
    render: (r) => (
      <span className="block truncate">
        {r.currentTitle ?? '-'}
        {r.currentEmployer && (
          <span className="text-muted-foreground"> at {r.currentEmployer}</span>
        )}
      </span>
    ),
  },
  {
    key: 'location',
    header: 'Location',
    width: 130,
    render: (r) => r.location ?? '-',
  },
  {
    key: 'skills',
    header: 'Skills',
    width: 220,
    render: (r) =>
      r.skills.length ? (
        <span className="flex items-center gap-1 overflow-hidden">
          {r.skills.slice(0, 3).map((s) => (
            <span
              key={s}
              className="shrink-0 rounded-sm bg-zinc-100 px-1.5 py-px text-[11px] text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            >
              {s}
            </span>
          ))}
          {r.skills.length > 3 && (
            <span className="text-[11px] text-muted-foreground">
              +{r.skills.length - 3}
            </span>
          )}
        </span>
      ) : (
        <span className="text-muted-foreground">-</span>
      ),
  },
  {
    key: 'source',
    header: 'Source',
    width: 140,
    render: (r) => (
      <span className="flex items-center gap-1.5">
        <SourceIcon source={r.source} />
        {SOURCE_LABEL[r.source]}
      </span>
    ),
  },
  {
    key: 'rightToWork',
    header: 'Right to work',
    width: 150,
    render: (r) => (
      <StatusPill tone={RIGHT_TO_WORK_TONE[r.rightToWork]}>
        {RIGHT_TO_WORK_LABEL[r.rightToWork]}
      </StatusPill>
    ),
  },
  {
    key: 'latest',
    header: 'Latest application',
    width: 240,
    render: (r) =>
      r.latestApplication ? (
        <span className="flex min-w-0 items-center gap-2">
          <StatusPill tone={STAGE_TONE[r.latestApplication.stage]} dot>
            {STAGE_LABEL[r.latestApplication.stage]}
          </StatusPill>
          <span className="truncate text-muted-foreground">
            {r.latestApplication.jobTitle}
          </span>
          {r.applicationCount > 1 && (
            <span className="shrink-0 text-[11px] text-muted-foreground">
              +{r.applicationCount - 1}
            </span>
          )}
        </span>
      ) : (
        <span className="text-muted-foreground">Not applied</span>
      ),
  },
  {
    key: 'rating',
    header: 'Rating',
    width: 110,
    render: (r) =>
      r.rating ? (
        <RatingStars value={r.rating} size={13} />
      ) : (
        <span className="text-muted-foreground">-</span>
      ),
  },
  {
    key: 'owner',
    header: 'Owner',
    width: 140,
    render: (r) => userLabel(r.owner) || '-',
  },
  {
    key: 'createdAt',
    header: 'Added',
    width: 120,
    mono: true,
    render: (r) => shortDate(r.createdAt),
  },
];

const PAGE_SIZE = 25;
const ALL = 'all';
const BULK_TAGS = [
  'Strong match',
  'Silver medalist',
  'Needs visa',
  'Keep warm',
];

function GridSkeleton() {
  return (
    <div className="flex-1 space-y-2 rounded-md border border-border p-3">
      {Array.from({ length: 10 }, (_, i) => (
        <Skeleton key={i} className="h-7 w-full" />
      ))}
    </div>
  );
}

export default function CandidatesPage() {
  const { hasPermission } = usePermissions();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [stageFilter, setStageFilter] = useState<string>(ALL);
  const [sourceFilter, setSourceFilter] = useState<string>(ALL);
  const [jobFilter, setJobFilter] = useState<string>(ALL);
  const [tags, setTags] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [pinnedCols, setPinnedCols] = useState<string[]>(['name']);
  const [hiddenCols, setHiddenCols] = useState<string[]>([]);
  const [knownTags, setKnownTags] = useState<string[]>([]);

  const params = useMemo<ListCandidatesRequest>(
    () => ({
      page,
      limit: PAGE_SIZE,
      ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
      ...(stageFilter !== ALL && { stage: stageFilter as ApplicationStage }),
      ...(sourceFilter !== ALL && { source: sourceFilter as CandidateSource }),
      ...(jobFilter !== ALL && { jobId: jobFilter }),
      ...(tags.length > 0 && { tags }),
    }),
    [page, debouncedSearch, stageFilter, sourceFilter, jobFilter, tags],
  );

  const canList = hasPermission(PERMISSIONS_ENUM.CANDIDATE_LIST_READ);
  const { data, isLoading, isFetching, isError, error } = useCandidatesQuery(
    params,
    canList,
  );
  const { data: jobsData } = useJobsQuery(
    { page: 1, limit: 100 },
    hasPermission(PERMISSIONS_ENUM.JOB_LIST_READ),
  );
  const updateStage = useUpdateApplicationStageMutation();
  const updateCandidate = useUpdateCandidateMutation();

  const rows = useMemo(() => data?.data ?? [], [data]);
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  useEffect(() => {
    setPage(1);
    setSelected([]);
  }, [debouncedSearch, stageFilter, sourceFilter, jobFilter, tags]);

  useEffect(() => {
    if (isError) toast.error('Could not load candidates', error?.message);
  }, [isError, error]);

  useEffect(() => {
    const found = rows.flatMap((r) => r.tags);
    if (found.length === 0) return;
    setKnownTags((prev) => {
      const next = Array.from(new Set([...prev, ...found])).sort();
      return next.length === prev.length ? prev : next;
    });
  }, [rows]);

  const selectedRows = rows.filter((r) => selected.includes(r.id));
  const withApplication = selectedRows.filter((r) => r.latestApplication);

  const runBulk = async (
    items: CandidateListItem[],
    action: (c: CandidateListItem) => Promise<unknown>,
    verb: string,
  ) => {
    const results = await Promise.allSettled(items.map(action));
    const ok = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.length - ok;
    const skipped = selectedRows.length - items.length;
    if (ok)
      toast.success(`${verb} ${ok} ${ok === 1 ? 'candidate' : 'candidates'}`);
    if (failed) toast.error(`${failed} could not be updated`);
    if (skipped)
      toast.info(`${skipped} skipped`, 'They have no application to update');
    setSelected([]);
  };

  const moveSelected = (stage: ApplicationStage) =>
    runBulk(
      withApplication,
      (c) =>
        updateStage.mutateAsync({
          id: c.latestApplication!.id,
          data: { stage },
        }),
      `Moved to ${STAGE_LABEL[stage]}:`,
    );

  const rejectSelected = (reason: string) =>
    runBulk(
      withApplication,
      (c) =>
        updateStage.mutateAsync({
          id: c.latestApplication!.id,
          data: { stage: 'rejected', rejectionReason: reason },
        }),
      'Rejected',
    );

  const tagSelected = (tag: string) =>
    runBulk(
      selectedRows,
      (c) =>
        c.tags.includes(tag)
          ? Promise.resolve()
          : updateCandidate.mutateAsync({
              id: c.id,
              data: { tags: [...c.tags, tag] },
            }),
      `Tagged as ${tag}:`,
    );

  const exportCsv = () =>
    downloadCsv('candidates', rows, [
      { header: 'First name', value: (c) => c.firstName },
      { header: 'Last name', value: (c) => c.lastName },
      { header: 'Email', value: (c) => c.email },
      { header: 'Phone', value: (c) => c.phone ?? '' },
      { header: 'Current title', value: (c) => c.currentTitle ?? '' },
      { header: 'Employer', value: (c) => c.currentEmployer ?? '' },
      { header: 'Location', value: (c) => c.location ?? '' },
      { header: 'Skills', value: (c) => c.skills.join('; ') },
      { header: 'Source', value: (c) => SOURCE_LABEL[c.source] },
      {
        header: 'Right to work',
        value: (c) => RIGHT_TO_WORK_LABEL[c.rightToWork],
      },
      {
        header: 'Latest job',
        value: (c) => c.latestApplication?.jobTitle ?? '',
      },
      {
        header: 'Stage',
        value: (c) =>
          c.latestApplication ? STAGE_LABEL[c.latestApplication.stage] : '',
      },
      { header: 'Owner', value: (c) => userLabel(c.owner) },
      { header: 'Added', value: (c) => shortDate(c.createdAt) },
    ]);

  const detailIndex = rows.findIndex((r) => r.id === detailId);

  const toggleTag = (v: string) =>
    setTags((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));

  const hasFilters =
    !!debouncedSearch ||
    stageFilter !== ALL ||
    sourceFilter !== ALL ||
    jobFilter !== ALL ||
    tags.length > 0;

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="-m-4 flex h-[calc(100vh-6rem)] flex-col gap-3 p-4">
      <FilterBar
        end={
          <>
            <ExportButton formats={['CSV']} onExport={exportCsv} />
            <ColumnChooser
              columns={columns.map((c) => ({ key: c.key, header: c.header }))}
              hidden={hiddenCols}
              onHiddenChange={setHiddenCols}
              pinned={pinnedCols}
              onPinnedChange={setPinnedCols}
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
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search candidates..."
        />
        <FilterDropdown
          label="Stage"
          value={stageFilter}
          options={[
            { label: 'All stages', value: ALL },
            ...APPLICATION_STAGES.map((st) => ({
              label: STAGE_LABEL[st],
              value: st,
            })),
          ]}
          onChange={setStageFilter}
        />
        <FilterDropdown
          label="Job"
          value={jobFilter}
          options={[
            { label: 'All jobs', value: ALL },
            ...(jobsData?.data ?? []).map((j) => ({
              label: j.title,
              value: j.id,
            })),
          ]}
          onChange={setJobFilter}
        />
        <FilterDropdown
          label="Source"
          icon={Filter}
          value={sourceFilter}
          options={[
            { label: 'All sources', value: ALL },
            ...CANDIDATE_SOURCES.map((s) => ({
              label: SOURCE_LABEL[s],
              value: s,
            })),
          ]}
          onChange={setSourceFilter}
        />
        <MultiFilter
          label="Tags"
          icon={Tag}
          selected={tags}
          onToggle={toggleTag}
          options={Array.from(new Set([...knownTags, ...tags])).map((t) => ({
            label: t,
            value: t,
          }))}
        />
      </FilterBar>

      {selected.length > 0 && (
        <SelectionBar
          count={selected.length}
          onClear={() => setSelected([])}
          actions={
            <>
              <PermissionGuard
                permissions={PERMISSIONS_ENUM.APPLICATION_UPDATE}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <ToolbarButton icon={ArrowRightLeft}>
                      Move stage
                    </ToolbarButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[10rem]">
                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                      Move latest application to
                    </DropdownMenuLabel>
                    {[...ACTIVE_STAGES, 'withdrawn' as const].map((st) => (
                      <DropdownMenuItem
                        key={st}
                        onSelect={() => moveSelected(st)}
                      >
                        {STAGE_LABEL[st]}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </PermissionGuard>
              <PermissionGuard permissions={PERMISSIONS_ENUM.CANDIDATE_UPDATE}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <ToolbarButton icon={Tag}>Tag</ToolbarButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[10rem]">
                    {Array.from(new Set([...BULK_TAGS, ...knownTags])).map(
                      (t) => (
                        <DropdownMenuItem
                          key={t}
                          onSelect={() => tagSelected(t)}
                        >
                          {t}
                        </DropdownMenuItem>
                      ),
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </PermissionGuard>
              <PermissionGuard
                permissions={PERMISSIONS_ENUM.APPLICATION_UPDATE}
              >
                <ToolbarButton
                  variant="danger"
                  icon={Trash2}
                  disabled={withApplication.length === 0}
                  onClick={() => setRejectOpen(true)}
                >
                  Reject
                </ToolbarButton>
              </PermissionGuard>
            </>
          }
        />
      )}

      <PermissionGuard
        permissions={PERMISSIONS_ENUM.CANDIDATE_LIST_READ}
        fallback={
          <EmptyState
            className="flex-1"
            title="You do not have access to candidates"
            description="Ask an admin to grant you the candidate list permission"
          />
        }
      >
        <div className="flex min-h-0 flex-1 flex-col">
          {isLoading ? (
            <GridSkeleton />
          ) : rows.length === 0 ? (
            <EmptyState
              className="flex-1 rounded-md border border-border"
              icon={<Users className="h-5 w-5" />}
              title={hasFilters ? 'No candidates match' : 'No candidates yet'}
              description={
                hasFilters
                  ? 'Try a different search or clear the filters'
                  : 'Add your first candidate or share a job on your careers page'
              }
              action={
                !hasFilters ? (
                  <PermissionGuard
                    permissions={PERMISSIONS_ENUM.CANDIDATE_CREATE}
                  >
                    <ToolbarButton
                      variant="primary"
                      icon={UserPlus}
                      onClick={() => setAddOpen(true)}
                    >
                      Add candidate
                    </ToolbarButton>
                  </PermissionGuard>
                ) : undefined
              }
            />
          ) : (
            <DataGrid
              columns={columns}
              rows={rows}
              getRowId={(r) => r.id}
              selectable
              selectedIds={selected}
              onSelectionChange={setSelected}
              onRowClick={(r) => setDetailId(r.id)}
              pinnedColumns={pinnedCols}
              onPinnedChange={setPinnedCols}
              hiddenColumns={hiddenCols}
              onHiddenColumnsChange={setHiddenCols}
              maxHeight="100%"
              className="flex-1"
            />
          )}
          <div className="flex items-center justify-between border border-t-0 border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            <span>
              {isFetching && !isLoading
                ? 'Updating...'
                : `Showing ${from}-${to} of ${total}`}
              {selected.length > 0 && ` · ${selected.length} selected`}
            </span>
            <span className="flex items-center gap-2">
              <span>
                Page {page} of {Math.max(1, totalPages)}
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
      </PermissionGuard>

      <AddCandidateDrawer
        open={addOpen}
        onOpenChange={setAddOpen}
        defaultJobId={jobFilter !== ALL ? jobFilter : undefined}
      />

      <RejectApplicationDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        count={withApplication.length}
        candidateName={
          withApplication.length === 1
            ? fullName(withApplication[0])
            : undefined
        }
        onConfirm={rejectSelected}
      />

      <CandidateDetailDrawer
        candidateId={detailId}
        open={detailId !== null}
        onOpenChange={(o) => !o && setDetailId(null)}
        hasPrev={detailIndex > 0}
        hasNext={detailIndex >= 0 && detailIndex < rows.length - 1}
        onPrev={() => detailIndex > 0 && setDetailId(rows[detailIndex - 1].id)}
        onNext={() =>
          detailIndex >= 0 &&
          detailIndex < rows.length - 1 &&
          setDetailId(rows[detailIndex + 1].id)
        }
      />
    </div>
  );
}
