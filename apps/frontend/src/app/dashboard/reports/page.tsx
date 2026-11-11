'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Award,
  BadgeDollarSign,
  Building2,
  ClipboardCheck,
  Filter,
  FileSignature,
  HeartHandshake,
  LayoutDashboard,
  Megaphone,
  Scale,
  Stethoscope,
  Target,
  Timer,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ExportButton,
  FilterDropdown,
  NotIntegratedBadge,
  SegmentedControl,
} from '@/components/patterns';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/lib/toast';
import { downloadCsv } from '@/lib/export-csv';
import type { Formatters } from '@/lib/format';
import { useFormatters } from '@/hooks/use-formatters';
import {
  useClientsQuery,
  useJobsQuery,
  useReportSummaryQuery,
  useUserNamesQuery,
} from '@/hooks/queries';
import {
  SOURCE_LABEL,
  errorMessage,
  personName,
  userLabel,
} from '@/components/applications/application-meta';
import type { LiveReportProps } from '@/components/reports/report-kit';
import { ExecutiveSummary } from '@/components/reports/executive-summary';
import {
  FunnelReport,
  JobHealthReport,
  VelocityReport,
} from '@/components/reports/pipeline-reports';
import {
  CostReport,
  SourceEffectivenessReport,
} from '@/components/reports/sourcing-reports';
import {
  InterviewerReport,
  RecruiterReport,
} from '@/components/reports/team-reports';
import {
  HiringPlanReport,
  OffersReport,
  QualityReport,
} from '@/components/reports/outcome-reports';
import { ClientReport } from '@/components/reports/client-reports';
import {
  CandidateExperienceReport,
  DiversityReport,
} from '@/components/reports/compliance-reports';
import type { ReportSummary, ReportSummaryRequest } from '@/types/report.type';

type Cell = string | number | null | undefined;

interface CsvSpec {
  headers: string[];
  rows: Cell[][];
}

interface ReportDef {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  live?: (props: LiveReportProps) => React.ReactElement;
  preview?: () => React.ReactElement;
  csv?: (data: ReportSummary, f: Formatters) => CsvSpec;
}

const GROUPS: { label: string; reports: ReportDef[] }[] = [
  {
    label: 'Overview',
    reports: [
      {
        id: 'executive',
        label: 'Executive summary',
        description: 'Headline hiring metrics and weekly volume',
        icon: LayoutDashboard,
        live: ExecutiveSummary,
        csv: (d) => ({
          headers: ['Week starting', 'Applications', 'Hires'],
          rows: d.applicationsOverTime.map((w) => [
            w.weekStart,
            w.applications,
            w.hires,
          ]),
        }),
      },
      {
        id: 'clients',
        label: 'By client',
        description: 'Applications and hires for each client',
        icon: Building2,
        live: ClientReport,
        csv: (d) => ({
          headers: ['Client', 'Applications', 'Hires'],
          rows: d.clients.map((c) => [c.name, c.applications, c.hires]),
        }),
      },
    ],
  },
  {
    label: 'Pipeline',
    reports: [
      {
        id: 'funnel',
        label: 'Funnel and conversion',
        description: 'Stage pass-through and rejection reasons',
        icon: Filter,
        live: FunnelReport,
        csv: (d) => ({
          headers: ['Stage', 'Category', 'Reached', 'Conversion to next %'],
          rows: d.funnel.map((s) => [
            s.name,
            s.category,
            s.reached,
            s.conversionToNext,
          ]),
        }),
      },
      {
        id: 'velocity',
        label: 'Velocity',
        description: 'Time to hire, time in stage and bottlenecks',
        icon: Timer,
        live: VelocityReport,
        csv: (d) => ({
          headers: ['Stage', 'Moves', 'Median days', 'Average days'],
          rows: [
            [
              'Time to hire',
              d.timeToHire.hires,
              d.timeToHire.medianDays,
              d.timeToHire.averageDays,
            ],
            ...d.timeInStage.map((s) => [
              s.name,
              s.samples,
              s.medianDays,
              s.averageDays,
            ]),
          ],
        }),
      },
      {
        id: 'job-health',
        label: 'Job health',
        description: 'Requisition aging, coverage and stale reqs',
        icon: Stethoscope,
        preview: JobHealthReport,
      },
    ],
  },
  {
    label: 'Sourcing',
    reports: [
      {
        id: 'sources',
        label: 'Source effectiveness',
        description: 'Applications and hires by candidate source',
        icon: Megaphone,
        live: SourceEffectivenessReport,
        csv: (d) => ({
          headers: ['Source', 'Applications', 'Hires', 'Hire rate %'],
          rows: d.sources.map((s) => [
            SOURCE_LABEL[s.source] ?? s.source,
            s.applications,
            s.hires,
            s.hireRate,
          ]),
        }),
      },
      {
        id: 'cost',
        label: 'Cost per hire',
        description: 'Spend by channel and budget vs actual',
        icon: BadgeDollarSign,
        preview: CostReport,
      },
    ],
  },
  {
    label: 'Team',
    reports: [
      {
        id: 'recruiters',
        label: 'Recruiter performance',
        description: 'Jobs, activity and outcomes per recruiter',
        icon: Users,
        live: RecruiterReport,
        csv: (d) => ({
          headers: [
            'Recruiter',
            'Jobs',
            'Applications',
            'Interviews',
            'Offers',
            'Hires',
          ],
          rows: d.recruiters.map((r) => [
            personName(r.recruiter) || r.recruiter.email,
            r.jobs,
            r.applications,
            r.interviews,
            r.offers,
            r.hires,
          ]),
        }),
      },
      {
        id: 'interviewers',
        label: 'Interviewers',
        description: 'Volume, completion, no-shows and ratings',
        icon: ClipboardCheck,
        live: InterviewerReport,
        csv: (d) => ({
          headers: ['Metric', 'Value'],
          rows: [
            ['Scheduled', d.interviews.scheduled],
            ['Completed', d.interviews.completed],
            ['Cancelled', d.interviews.cancelled],
            ['No show', d.interviews.noShow],
            ['No-show rate %', d.interviews.noShowRate],
            ['Scorecards', d.interviews.scorecards],
            ['Average rating', d.interviews.averageRating],
          ],
        }),
      },
    ],
  },
  {
    label: 'Outcomes',
    reports: [
      {
        id: 'offers',
        label: 'Offers',
        description: 'Sent, accepted, declined and acceptance rate',
        icon: FileSignature,
        live: OffersReport,
        csv: (d) => ({
          headers: ['Metric', 'Value'],
          rows: [
            ['Created', d.offers.created],
            ['Pending approval', d.offers.pendingApproval],
            ['Sent', d.offers.sent],
            ['Accepted', d.offers.accepted],
            ['Declined', d.offers.declined],
            ['Acceptance rate %', d.offers.acceptanceRate],
          ],
        }),
      },
      {
        id: 'quality',
        label: 'Quality of hire',
        description: 'Retention, manager rating and ramp time',
        icon: Award,
        preview: QualityReport,
      },
      {
        id: 'plan',
        label: 'Hiring plan',
        description: 'Targets vs hires by team and quarter',
        icon: Target,
        preview: HiringPlanReport,
      },
    ],
  },
  {
    label: 'Compliance',
    reports: [
      {
        id: 'diversity',
        label: 'Diversity',
        description: 'Representation and pass-through parity',
        icon: Scale,
        preview: DiversityReport,
      },
      {
        id: 'experience',
        label: 'Candidate experience',
        description: 'NPS, stage surveys and response SLAs',
        icon: HeartHandshake,
        preview: CandidateExperienceReport,
      },
    ],
  },
];

const ALL_REPORTS = GROUPS.flatMap((g) => g.reports);

type RangePreset = '30d' | '90d' | '180d' | 'custom';

const PRESET_DAYS: Record<Exclude<RangePreset, 'custom'>, number> = {
  '30d': 30,
  '90d': 90,
  '180d': 180,
};

const ALL = 'all';

function localDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function dayStart(key: string) {
  return new Date(`${key}T00:00:00`);
}

function dayEnd(key: string) {
  return new Date(`${key}T23:59:59.999`);
}

function presetRange(days: number) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  return { from: localDateKey(start), to: localDateKey(end) };
}

function previousWindow(from: Date, to: Date) {
  const span = to.getTime() - from.getTime();
  const prevTo = new Date(from.getTime() - 1);
  return { from: new Date(prevTo.getTime() - span), to: prevTo };
}

export default function ReportsPage() {
  const f = useFormatters();
  const [reportId, setReportId] = useState('executive');
  const [preset, setPreset] = useState<RangePreset>('90d');
  const [custom, setCustom] = useState(() => presetRange(90));
  const [jobId, setJobId] = useState(ALL);
  const [clientId, setClientId] = useState(ALL);
  const [recruiterId, setRecruiterId] = useState(ALL);
  const report = ALL_REPORTS.find((r) => r.id === reportId) ?? ALL_REPORTS[0];
  const { data: jobsData } = useJobsQuery({ page: 1, limit: 100 });
  const { data: clientsData } = useClientsQuery({ page: 1, limit: 100 });
  const { data: users = [] } = useUserNamesQuery();

  const range = useMemo(
    () => (preset === 'custom' ? custom : presetRange(PRESET_DAYS[preset])),
    [preset, custom],
  );
  const rangeValid = !!range.from && !!range.to && range.from <= range.to;

  const filters = useMemo((): ReportSummaryRequest => {
    const scope = {
      ...(jobId !== ALL ? { jobId } : {}),
      ...(clientId !== ALL ? { clientId } : {}),
      ...(recruiterId !== ALL ? { recruiterId } : {}),
    };
    return rangeValid
      ? {
          from: dayStart(range.from).toISOString(),
          to: dayEnd(range.to).toISOString(),
          ...scope,
        }
      : scope;
  }, [range, rangeValid, jobId, clientId, recruiterId]);

  const previousFilters = useMemo((): ReportSummaryRequest => {
    if (!filters.from || !filters.to) return filters;
    const prev = previousWindow(new Date(filters.from), new Date(filters.to));
    return {
      ...filters,
      from: prev.from.toISOString(),
      to: prev.to.toISOString(),
    };
  }, [filters]);

  const isLive = !!report.live;
  const summary = useReportSummaryQuery(filters, rangeValid && isLive);
  const previous = useReportSummaryQuery(previousFilters, rangeValid && isLive);

  useEffect(() => {
    if (summary.isError) {
      toast.error('Could not load report', errorMessage(summary.error));
    }
  }, [summary.isError, summary.error]);

  const rangeLabel = rangeValid
    ? `${f.date(range.from)} to ${f.date(range.to)}`
    : 'Pick a valid date range';

  const exportReport = (format: string) => {
    if (format === 'PDF') {
      window.print();
      return;
    }
    if (!report.csv || !summary.data) return;
    const spec = report.csv(summary.data, f);
    downloadCsv(
      `${report.id}-report-${range.from}-${range.to}`,
      spec.rows,
      spec.headers.map((header, i) => ({ header, value: (r) => r[i] })),
    );
    toast.success('Report exported', `${report.label}, ${rangeLabel}`);
  };

  const scopeLabel = [
    jobId !== ALL && (jobsData?.data ?? []).find((j) => j.id === jobId)?.title,
    clientId !== ALL &&
      (clientsData?.data ?? []).find((c) => c.id === clientId)?.name,
    recruiterId !== ALL && userLabel(users.find((u) => u.id === recruiterId)),
  ]
    .filter(Boolean)
    .join(' · ');

  const Live = report.live;
  const Preview = report.preview;

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <aside className="w-full shrink-0 print:hidden lg:sticky lg:top-0 lg:w-56">
        <nav className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1.5 lg:max-h-[calc(100vh-7rem)] lg:flex-col lg:gap-0 lg:overflow-y-auto lg:overflow-x-hidden">
          {GROUPS.map((group) => (
            <div
              key={group.label}
              className="flex shrink-0 gap-1 lg:flex-col lg:gap-0.5 lg:pb-2 lg:last:pb-0"
            >
              <p className="hidden px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground lg:block">
                {group.label}
              </p>
              {group.reports.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setReportId(r.id)}
                  className={cn(
                    'flex items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-1.5 text-[13px]',
                    reportId === r.id
                      ? 'bg-[#EDF1EE] font-semibold text-[#3F6650] dark:bg-[#3F6650]/25 dark:text-[#8FBFA1]'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <r.icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left">{r.label}</span>
                  {!r.live && (
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-amber-500 dark:bg-amber-400"
                      title="Preview only"
                    />
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">{report.label}</h1>
              {!isLive && <NotIntegratedBadge />}
            </div>
            <p className="text-xs text-muted-foreground">
              {report.description}
              {isLive && ` · ${rangeLabel}`}
              {isLive && scopeLabel && ` · ${scopeLabel}`}
              {isLive && ' · compared with the previous period'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 print:hidden">
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
            <FilterDropdown
              label="Recruiter"
              value={recruiterId}
              onChange={setRecruiterId}
              options={[
                { label: 'All', value: ALL },
                ...users.map((u) => ({ label: userLabel(u), value: u.id })),
              ]}
            />
            <SegmentedControl
              value={preset}
              onChange={(v) => {
                if (v === 'custom' && preset !== 'custom') setCustom(range);
                setPreset(v);
              }}
              options={[
                { value: '30d', label: '30 days' },
                { value: '90d', label: '90 days' },
                { value: '180d', label: '180 days' },
                { value: 'custom', label: 'Custom' },
              ]}
            />
            {preset === 'custom' && (
              <div className="flex items-center gap-1.5">
                <Input
                  type="date"
                  aria-label="From"
                  className="h-8 w-36"
                  value={custom.from}
                  max={custom.to || undefined}
                  onChange={(e) =>
                    setCustom((c) => ({ ...c, from: e.target.value }))
                  }
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  type="date"
                  aria-label="To"
                  className="h-8 w-36"
                  value={custom.to}
                  min={custom.from || undefined}
                  onChange={(e) =>
                    setCustom((c) => ({ ...c, to: e.target.value }))
                  }
                />
              </div>
            )}
            <ExportButton
              formats={report.csv ? ['CSV', 'PDF'] : ['PDF']}
              onExport={exportReport}
            />
          </div>
        </div>
        {Preview ? (
          <Preview />
        ) : !rangeValid ? (
          <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            The start date must be on or before the end date
          </p>
        ) : Live && summary.data ? (
          <div className={cn(summary.isFetching && 'opacity-70')}>
            <Live
              data={summary.data}
              previous={previous.data}
              filters={filters}
            />
          </div>
        ) : summary.isError ? (
          <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Could not load this report
          </p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
            <Skeleton className="h-72 w-full" />
          </div>
        )}
      </div>
    </div>
  );
}
