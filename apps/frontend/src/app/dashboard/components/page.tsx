'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  type ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Users,
  Building2,
  Link2,
  Inbox,
  Eye,
  Pencil,
  Trash2,
  BarChart3,
  Briefcase,
  Clock,
  Gauge,
  LayoutGrid,
  List,
  UserPlus,
  CalendarDays,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  FilterBar,
  FilterDropdown,
  ToggleControl,
  RefreshButton,
  SearchInput,
  SegmentedControl,
  SectionCard,
  SourceCard,
  EntityCard,
  StatTile,
  StatTileRow,
  TrendStat,
  EmptyState,
  DetailDrawer,
  DetailPanel,
  PanelSection,
  DataTable,
  DataTableToolbar,
  DataGrid,
  StatusPill,
  AvatarStack,
  SortableHeader,
  RowActions,
  AreaSeriesChart,
  BarSeriesChart,
  DonutChart,
  LegendDots,
  FunnelChart,
  StageProgress,
  MetricRing,
  HeatmapGrid,
  RankedBarList,
  Scorecard,
  KanbanBoard,
  Timeline,
  RatingStars,
  CHART_COLORS,
  type PillTone,
  type KanbanColumnDef,
  type DataGridColumn,
} from '@/components/patterns';

interface Employee {
  id: string;
  name: string;
  department: string;
  status: 'active' | 'onboarding' | 'inactive';
  team: { name: string }[];
  joinedAt: string;
}

const EMPLOYEES: Employee[] = [
  {
    id: '1',
    name: 'Aisha Khan',
    department: 'Engineering',
    status: 'active',
    team: [{ name: 'Ravi Menon' }, { name: 'Sara Lee' }, { name: 'Tom Ford' }],
    joinedAt: '2024-03-11',
  },
  {
    id: '2',
    name: 'Marcus Webb',
    department: 'Design',
    status: 'onboarding',
    team: [{ name: 'Nina Patel' }, { name: 'Omar Farooq' }],
    joinedAt: '2025-01-06',
  },
  {
    id: '3',
    name: 'Lena Ortiz',
    department: 'Sales',
    status: 'inactive',
    team: [{ name: 'Jake Cole' }],
    joinedAt: '2023-09-22',
  },
];

const STATUS_TONE: Record<Employee['status'], PillTone> = {
  active: 'success',
  onboarding: 'info',
  inactive: 'neutral',
};

interface Candidate {
  id: string;
  name: string;
  role: string;
  rating: number;
  source: string;
}

const PIPELINE: KanbanColumnDef<Candidate>[] = [
  {
    id: 'applied',
    title: 'Applied',
    color: '#8FBFA1',
    items: [
      {
        id: 'c1',
        name: 'Priya Nair',
        role: 'Frontend Engineer',
        rating: 3,
        source: 'LinkedIn',
      },
      {
        id: 'c2',
        name: 'Tom Becker',
        role: 'Frontend Engineer',
        rating: 4,
        source: 'Referral',
      },
    ],
  },
  {
    id: 'screen',
    title: 'Screening',
    color: '#4C6EF5',
    items: [
      {
        id: 'c3',
        name: 'Dana White',
        role: 'Product Designer',
        rating: 4,
        source: 'Careers page',
      },
    ],
  },
  {
    id: 'interview',
    title: 'Interview',
    color: '#E0A458',
    items: [
      {
        id: 'c4',
        name: 'Sam Rivera',
        role: 'Backend Engineer',
        rating: 5,
        source: 'Referral',
      },
      {
        id: 'c5',
        name: 'Mei Chen',
        role: 'Backend Engineer',
        rating: 4,
        source: 'LinkedIn',
      },
    ],
  },
  {
    id: 'offer',
    title: 'Offer',
    color: '#3F6650',
    items: [
      {
        id: 'c6',
        name: 'Omar Haddad',
        role: 'Data Analyst',
        rating: 5,
        source: 'Careers page',
      },
    ],
  },
];

const APPLICATIONS_TREND = [
  { week: 'W1', applications: 42, interviews: 8 },
  { week: 'W2', applications: 55, interviews: 12 },
  { week: 'W3', applications: 48, interviews: 10 },
  { week: 'W4', applications: 71, interviews: 16 },
  { week: 'W5', applications: 63, interviews: 14 },
  { week: 'W6', applications: 88, interviews: 21 },
];

const PIPELINE_FUNNEL = [
  { label: 'Applied', value: 1240, color: '#8FBFA1' },
  { label: 'Screened', value: 420, color: '#4C6EF5' },
  { label: 'Interviewed', value: 180, color: '#E0A458' },
  { label: 'Offer', value: 46, color: '#3F6650' },
  { label: 'Hired', value: 31, color: '#16201A' },
];

const SOURCES = [
  { source: 'LinkedIn', hires: 12 },
  { source: 'Referral', hires: 9 },
  { source: 'Careers page', hires: 6 },
  { source: 'Indeed', hires: 3 },
  { source: 'Agency', hires: 1 },
];

const OFFER_OUTCOME = [
  { key: 'accepted', label: 'Accepted', value: 24, color: '#3F6650' },
  { key: 'pending', label: 'Pending', value: 7, color: '#E0A458' },
  { key: 'declined', label: 'Declined', value: 5, color: '#E06B6B' },
];

interface GridRow {
  id: string;
  name: string;
  role: string;
  stage: string;
  source: string;
  rating: number;
  experience: number;
  location: string;
  salary: number;
  applied: string;
}

const GRID_STAGE_TONE: Record<string, PillTone> = {
  Applied: 'neutral',
  Screening: 'info',
  Interview: 'warning',
  Offer: 'success',
  Rejected: 'danger',
};

const GRID_ROWS: GridRow[] = [
  {
    id: 'g1',
    name: 'Priya Nair',
    role: 'Frontend Engineer',
    stage: 'Interview',
    source: 'LinkedIn',
    rating: 4,
    experience: 6,
    location: 'Bengaluru',
    salary: 2800000,
    applied: '2026-09-02',
  },
  {
    id: 'g2',
    name: 'Tom Becker',
    role: 'Frontend Engineer',
    stage: 'Screening',
    source: 'Referral',
    rating: 3,
    experience: 4,
    location: 'Berlin',
    salary: 78000,
    applied: '2026-09-04',
  },
  {
    id: 'g3',
    name: 'Dana White',
    role: 'Product Designer',
    stage: 'Offer',
    source: 'Careers page',
    rating: 5,
    experience: 8,
    location: 'Remote',
    salary: 115000,
    applied: '2026-08-28',
  },
  {
    id: 'g4',
    name: 'Sam Rivera',
    role: 'Backend Engineer',
    stage: 'Interview',
    source: 'Referral',
    rating: 5,
    experience: 7,
    location: 'Austin',
    salary: 142000,
    applied: '2026-09-01',
  },
  {
    id: 'g5',
    name: 'Mei Chen',
    role: 'Backend Engineer',
    stage: 'Applied',
    source: 'LinkedIn',
    rating: 4,
    experience: 5,
    location: 'Singapore',
    salary: 96000,
    applied: '2026-09-08',
  },
  {
    id: 'g6',
    name: 'Omar Haddad',
    role: 'Data Analyst',
    stage: 'Offer',
    source: 'Careers page',
    rating: 5,
    experience: 3,
    location: 'Dubai',
    salary: 68000,
    applied: '2026-08-30',
  },
  {
    id: 'g7',
    name: 'Lena Ortiz',
    role: 'Data Analyst',
    stage: 'Rejected',
    source: 'Agency',
    rating: 2,
    experience: 2,
    location: 'Madrid',
    salary: 52000,
    applied: '2026-09-05',
  },
  {
    id: 'g8',
    name: 'Raj Malhotra',
    role: 'DevOps Engineer',
    stage: 'Screening',
    source: 'Indeed',
    rating: 3,
    experience: 9,
    location: 'Pune',
    salary: 3200000,
    applied: '2026-09-06',
  },
  {
    id: 'g9',
    name: 'Kate Wilson',
    role: 'Product Manager',
    stage: 'Interview',
    source: 'Referral',
    rating: 4,
    experience: 10,
    location: 'London',
    salary: 105000,
    applied: '2026-09-03',
  },
];

const TOP_SOURCES = [
  { label: 'Referral', value: 38, color: '#3F6650' },
  { label: 'LinkedIn', value: 31, color: '#4C6EF5' },
  { label: 'Careers page', value: 22, color: '#8FBFA1' },
  { label: 'Indeed', value: 14, color: '#E0A458' },
  { label: 'Agency', value: 6, color: '#E06B6B' },
];

const HEATMAP_COLS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const HEATMAP_ROWS = [
  { label: 'Phone', values: [4, 6, 3, 5, 2] },
  { label: 'Technical', values: [2, 5, 8, 6, 3] },
  { label: 'Onsite', values: [1, 2, 4, 3, 5] },
  { label: 'Final', values: [0, 1, 2, 2, 4] },
];

export default function ComponentsShowcasePage() {
  const [range, setRange] = useState('7d');
  const [unbranded, setUnbranded] = useState(false);
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [pipelineView, setPipelineView] = useState<'board' | 'table'>('board');
  const [candidateSearch, setCandidateSearch] = useState('');
  const [gridSelection, setGridSelection] = useState<string[]>(['g1', 'g4']);

  const gridColumns: DataGridColumn<GridRow>[] = [
    {
      key: 'name',
      header: 'Candidate',
      width: 160,
      render: (r) => <span className="font-medium">{r.name}</span>,
    },
    { key: 'role', header: 'Role', width: 150 },
    {
      key: 'stage',
      header: 'Stage',
      width: 120,
      render: (r) => (
        <StatusPill tone={GRID_STAGE_TONE[r.stage] ?? 'neutral'} dot>
          {r.stage}
        </StatusPill>
      ),
    },
    { key: 'source', header: 'Source', width: 120 },
    {
      key: 'rating',
      header: 'Rating',
      width: 110,
      render: (r) => <RatingStars value={r.rating} size={12} />,
    },
    {
      key: 'experience',
      header: 'Exp (yrs)',
      width: 90,
      align: 'right',
      mono: true,
    },
    { key: 'location', header: 'Location', width: 120 },
    {
      key: 'salary',
      header: 'Expected',
      width: 110,
      align: 'right',
      mono: true,
      render: (r) => r.salary.toLocaleString(),
    },
    { key: 'applied', header: 'Applied', width: 110, mono: true },
  ];

  const openDrawer = (employee: Employee) => {
    setSelected(employee);
    setDrawerOpen(true);
  };

  const columns = useMemo<ColumnDef<Employee>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <SortableHeader column={column} title="Name" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <AvatarStack items={[{ name: row.original.name }]} size={28} />
            <span className="font-medium">{row.original.name}</span>
          </div>
        ),
      },
      {
        accessorKey: 'department',
        header: ({ column }) => (
          <SortableHeader column={column} title="Department" />
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <StatusPill tone={STATUS_TONE[row.original.status]} dot>
            {row.original.status}
          </StatusPill>
        ),
      },
      {
        id: 'team',
        header: 'Team',
        cell: ({ row }) => <AvatarStack items={row.original.team} />,
      },
      {
        accessorKey: 'joinedAt',
        header: ({ column }) => (
          <SortableHeader column={column} title="Joined" />
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => openDrawer(row.original)}
            >
              Details
            </Button>
            <RowActions
              actions={[
                {
                  label: 'View',
                  icon: <Eye className="h-4 w-4" />,
                  onSelect: () => openDrawer(row.original),
                },
                {
                  label: 'Edit',
                  icon: <Pencil className="h-4 w-4" />,
                  onSelect: () => {},
                },
                {
                  label: 'Delete',
                  icon: <Trash2 className="h-4 w-4" />,
                  onSelect: () => {},
                  destructive: true,
                },
              ]}
            />
          </div>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: EMPLOYEES,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Component Library</h1>
          <p className="text-sm text-muted-foreground">
            Reusable building blocks for RabbitHR, dev-only reference gallery
          </p>
        </div>
        <Link
          href="/dashboard/components/toolbars"
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-[13px] font-medium hover:bg-accent"
        >
          Toolbar reference
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
        </Link>
      </div>

      <SectionCard
        icon={BarChart3}
        title="Filter toolbar"
        subtitle="FilterBar, FilterDropdown, ToggleControl, RefreshButton"
        info="Compose page-level filters with pill dropdowns and inline toggles"
        bodyClassName="p-3"
      >
        <FilterBar end={<RefreshButton onClick={() => {}} />}>
          <FilterDropdown
            label="Range"
            value={range}
            onChange={setRange}
            options={[
              { label: 'Last 7 days', value: '7d' },
              { label: 'Last 30 days', value: '30d' },
              { label: 'This quarter', value: 'q' },
            ]}
          />
          <FilterDropdown
            icon={Building2}
            value="all"
            onChange={() => {}}
            options={[
              { label: 'All departments', value: 'all' },
              { label: 'Engineering', value: 'eng' },
            ]}
          />
          <ToggleControl
            label="Active only"
            checked={unbranded}
            onCheckedChange={setUnbranded}
          />
        </FilterBar>
      </SectionCard>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Stat tiles
        </h2>
        <StatTileRow>
          <StatTile label="Active" value={128} tone="positive" />
          <StatTile label="Onboarding" value={9} tone="info" />
          <StatTile label="On leave" value={4} tone="warning" />
          <StatTile label="Total" value={141} unit="people" />
        </StatTileRow>
      </div>

      <SectionCard
        icon={Users}
        title="Employees"
        subtitle="Data table with sortable headers, status pills, avatar stacks, row actions"
        info="Built on the TanStack DataTable plus the pattern cell kit"
      >
        <DataTableToolbar
          table={table}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search employees..."
          actions={
            <FilterDropdown
              value="all"
              onChange={() => {}}
              options={[
                { label: 'All statuses', value: 'all' },
                { label: 'Active', value: 'active' },
              ]}
            />
          }
        />
        <DataTable table={table} onRowClick={openDrawer} />
      </SectionCard>

      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard icon={Link2} title="Source cards" subtitle="SourceCard">
          <div className="space-y-2">
            <SourceCard
              title="Employee handbook"
              url="https://intranet.rabbithr.app/handbook"
            />
            <SourceCard
              title="Leave policy 2026"
              url="https://intranet.rabbithr.app/policies/leave"
            />
          </div>
        </SectionCard>

        <SectionCard icon={Inbox} title="Empty state" subtitle="EmptyState">
          <EmptyState
            icon={<Inbox className="h-8 w-8" />}
            title="No records yet"
            description="When data arrives it will show up here"
            action={<Button size="sm">Add record</Button>}
          />
        </SectionCard>
      </div>

      <SectionCard
        title="Status pills"
        subtitle="StatusPill tones"
        info="Tone-based pills for statuses and categories"
      >
        <div className="flex flex-wrap gap-2">
          <StatusPill tone="success" dot>
            Active
          </StatusPill>
          <StatusPill tone="info" dot>
            Onboarding
          </StatusPill>
          <StatusPill tone="warning" dot>
            On leave
          </StatusPill>
          <StatusPill tone="danger" dot>
            Terminated
          </StatusPill>
          <StatusPill tone="neutral" dot>
            Draft
          </StatusPill>
          <StatusPill tone="purple" dot>
            Contractor
          </StatusPill>
        </div>
      </SectionCard>

      <div className="space-y-2 pt-2">
        <h2 className="text-lg font-semibold">ATS patterns</h2>
        <p className="text-sm text-muted-foreground">
          Recruiting-flavoured demos of the charts, kanban, and timeline
          components.
        </p>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          KPI trends (TrendStat)
        </h2>
        <StatTileRow>
          <TrendStat
            label="Open roles"
            value={18}
            delta={12.5}
            points={[10, 12, 11, 14, 15, 16, 18]}
          />
          <TrendStat
            label="In pipeline"
            value={342}
            delta={8.1}
            points={[280, 300, 295, 310, 330, 338, 342]}
          />
          <TrendStat
            label="Avg. time to hire"
            value={27}
            unit="days"
            delta={-6.4}
            invertDelta
            points={[34, 33, 31, 30, 29, 28, 27]}
            color="#4C6EF5"
          />
          <TrendStat
            label="Offer accept rate"
            value="82%"
            delta={3.2}
            points={[74, 76, 78, 77, 80, 81, 82]}
            color="#E0A458"
          />
        </StatTileRow>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          icon={BarChart3}
          title="Applications & interviews"
          subtitle="Last 6 weeks"
          info="AreaSeriesChart with two series"
        >
          <AreaSeriesChart
            data={APPLICATIONS_TREND}
            xKey="week"
            height={240}
            series={[
              {
                key: 'applications',
                label: 'Applications',
                color: CHART_COLORS[0],
              },
              {
                key: 'interviews',
                label: 'Interviews',
                color: CHART_COLORS[2],
              },
            ]}
          />
        </SectionCard>

        <SectionCard
          icon={Gauge}
          title="Pipeline funnel"
          subtitle="Conversion by stage"
          info="FunnelChart with stage-to-stage conversion"
        >
          <FunnelChart stages={PIPELINE_FUNNEL} />
        </SectionCard>

        <SectionCard
          icon={UserPlus}
          title="Hires by source"
          subtitle="This quarter"
          info="Horizontal BarSeriesChart"
        >
          <BarSeriesChart
            data={SOURCES}
            xKey="source"
            horizontal
            height={220}
            series={[{ key: 'hires', label: 'Hires', color: CHART_COLORS[0] }]}
          />
        </SectionCard>

        <SectionCard
          icon={CheckCircle2}
          title="Offer outcomes"
          subtitle="36 offers"
          info="DonutChart + LegendDots"
        >
          <div className="flex items-center gap-6">
            <DonutChart
              data={OFFER_OUTCOME}
              centerValue="67%"
              centerLabel="Accepted"
            />
            <div className="flex-1">
              <LegendDots
                items={OFFER_OUTCOME.map((o) => ({
                  color: o.color,
                  label: o.label,
                  value: String(o.value),
                }))}
              />
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        icon={Briefcase}
        title="Candidate pipeline"
        subtitle="KanbanBoard, EntityCard, RatingStars, SegmentedControl"
        info="Generic KanbanBoard rendering candidate cards per stage"
        actions={
          <div className="flex items-center gap-2">
            <SearchInput
              value={candidateSearch}
              onChange={setCandidateSearch}
              placeholder="Search candidates..."
            />
            <SegmentedControl
              value={pipelineView}
              onChange={setPipelineView}
              options={[
                {
                  value: 'board',
                  icon: <LayoutGrid className="h-4 w-4" />,
                  label: 'Board',
                },
                {
                  value: 'table',
                  icon: <List className="h-4 w-4" />,
                  label: 'Table',
                },
              ]}
            />
          </div>
        }
      >
        {pipelineView === 'board' ? (
          <KanbanBoard
            columns={PIPELINE}
            getItemKey={(c) => c.id}
            renderCard={(c) => (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{c.name}</span>
                  <RatingStars value={c.rating} size={12} />
                </div>
                <p className="text-xs text-muted-foreground">{c.role}</p>
                <StatusPill tone="neutral">{c.source}</StatusPill>
              </div>
            )}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PIPELINE.flatMap((col) => col.items).map((c) => (
              <EntityCard
                key={c.id}
                name={c.name}
                subtitle={c.role}
                meta={<RatingStars value={c.rating} size={12} />}
                tags={<StatusPill tone="neutral">{c.source}</StatusPill>}
              />
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        icon={LayoutGrid}
        title="Data grid (dense)"
        subtitle="DataGrid — sharp bordered grid for big data, sticky header, pinned first column, row selection"
        info="ERP-style dense grid with 1px cell borders and a frozen first column"
        bodyClassName="p-0"
        actions={
          gridSelection.length > 0 ? (
            <StatusPill tone="success">
              {gridSelection.length} selected
            </StatusPill>
          ) : undefined
        }
      >
        <DataGrid
          columns={gridColumns}
          rows={GRID_ROWS}
          getRowId={(r) => r.id}
          selectable
          selectedIds={gridSelection}
          onSelectionChange={setGridSelection}
          pinFirstColumn
          maxHeight={340}
        />
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          icon={Gauge}
          title="Candidate stage"
          subtitle="StageProgress"
          info="Horizontal pipeline progress for a single record"
        >
          <StageProgress
            currentIndex={2}
            stages={[
              { label: 'Applied' },
              { label: 'Screening' },
              { label: 'Interview' },
              { label: 'Offer' },
              { label: 'Hired' },
            ]}
          />
        </SectionCard>

        <SectionCard
          icon={BarChart3}
          title="Recruiting rings"
          subtitle="MetricRing"
          info="Radial gauges for rate-style metrics"
        >
          <div className="flex flex-wrap items-center justify-around gap-4">
            <MetricRing value={82} label="Accept" />
            <MetricRing value={68} label="Quality" color="#4C6EF5" />
            <MetricRing value={45} label="Diversity" color="#E0A458" />
          </div>
        </SectionCard>

        <SectionCard
          icon={CalendarDays}
          title="Interviews heatmap"
          subtitle="HeatmapGrid"
          info="Value intensity across two dimensions"
        >
          <HeatmapGrid columns={HEATMAP_COLS} rows={HEATMAP_ROWS} />
        </SectionCard>

        <SectionCard
          icon={UserPlus}
          title="Top sources"
          subtitle="RankedBarList"
          info="Ranked horizontal bars with values"
        >
          <RankedBarList items={TOP_SOURCES} />
        </SectionCard>
      </div>

      <SectionCard
        icon={CheckCircle2}
        title="Interview scorecard"
        subtitle="Scorecard"
        info="Weighted criteria with per-item ratings"
      >
        <div className="max-w-md">
          <Scorecard
            criteria={[
              { label: 'Technical skills', rating: 5 },
              { label: 'Communication', rating: 4 },
              { label: 'Culture fit', rating: 4 },
              { label: 'Problem solving', rating: 5 },
              { label: 'Leadership', rating: 3 },
            ]}
          />
        </div>
      </SectionCard>

      <DetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={selected?.name ?? 'Details'}
        onBack={() => setDrawerOpen(false)}
        chips={
          selected && (
            <StatusPill tone={STATUS_TONE[selected.status]} dot>
              {selected.status}
            </StatusPill>
          )
        }
      >
        {selected && (
          <DetailPanel>
            <PanelSection icon={<Users className="h-4 w-4" />} title="Profile">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Department</span>
                  <span>{selected.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Joined</span>
                  <span>{selected.joinedAt}</span>
                </div>
              </div>
            </PanelSection>
            <PanelSection title="Team">
              <AvatarStack items={selected.team} />
            </PanelSection>
            <PanelSection
              icon={<CheckCircle2 className="h-4 w-4" />}
              title="Scorecard"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Overall rating</span>
                <RatingStars value={4} />
              </div>
            </PanelSection>
            <PanelSection
              icon={<MessageSquare className="h-4 w-4" />}
              title="Activity"
            >
              <Timeline
                entries={[
                  {
                    id: 'a1',
                    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
                    color: '#3F6650',
                    title: 'Moved to Interview',
                    time: '2h ago',
                    meta: 'by Recruiter',
                  },
                  {
                    id: 'a2',
                    icon: <CalendarDays className="h-3.5 w-3.5" />,
                    title: 'Interview scheduled',
                    time: 'Yesterday',
                    meta: 'Panel of 3',
                  },
                  {
                    id: 'a3',
                    icon: <UserPlus className="h-3.5 w-3.5" />,
                    title: 'Application received',
                    time: '3 days ago',
                    meta: 'via Referral',
                  },
                ]}
              />
            </PanelSection>
            <PanelSection title="Documents">
              <EmptyState compact title="No documents" />
            </PanelSection>
          </DetailPanel>
        )}
      </DetailDrawer>
    </div>
  );
}
