'use client';

import { useMemo, useRef, useState } from 'react';
import {
  Award,
  BadgeDollarSign,
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
import { toast } from '@/lib/toast';
import { downloadCsv } from '@/lib/export-csv';
import {
  RANGE_FACTOR,
  ReportScopeContext,
  type KpiRecord,
  type ReportProps,
  type ReportRange,
} from '@/components/reports/report-kit';
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
import {
  CandidateExperienceReport,
  DiversityReport,
} from '@/components/reports/compliance-reports';

interface ReportDef {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  component: (props: ReportProps) => React.ReactElement;
}

const GROUPS: { label: string; reports: ReportDef[] }[] = [
  {
    label: 'Overview',
    reports: [
      {
        id: 'executive',
        label: 'Executive summary',
        description: 'Headline hiring metrics, plan attainment and risks',
        icon: LayoutDashboard,
        component: ExecutiveSummary,
      },
    ],
  },
  {
    label: 'Pipeline',
    reports: [
      {
        id: 'funnel',
        label: 'Funnel and conversion',
        description: 'Stage pass-through by department and role',
        icon: Filter,
        component: FunnelReport,
      },
      {
        id: 'velocity',
        label: 'Velocity',
        description: 'Time to hire, time in stage and bottlenecks',
        icon: Timer,
        component: VelocityReport,
      },
      {
        id: 'job-health',
        label: 'Job health',
        description: 'Requisition aging, coverage and stale reqs',
        icon: Stethoscope,
        component: JobHealthReport,
      },
    ],
  },
  {
    label: 'Sourcing',
    reports: [
      {
        id: 'sources',
        label: 'Source effectiveness',
        description: 'Volume, pass rate and quality by channel',
        icon: Megaphone,
        component: SourceEffectivenessReport,
      },
      {
        id: 'cost',
        label: 'Cost per hire',
        description: 'Spend by channel and budget vs actual',
        icon: BadgeDollarSign,
        component: CostReport,
      },
    ],
  },
  {
    label: 'Team',
    reports: [
      {
        id: 'recruiters',
        label: 'Recruiter performance',
        description: 'Workload, activity and outcomes per recruiter',
        icon: Users,
        component: RecruiterReport,
      },
      {
        id: 'interviewers',
        label: 'Interviewers',
        description: 'Load, feedback timeliness and calibration',
        icon: ClipboardCheck,
        component: InterviewerReport,
      },
    ],
  },
  {
    label: 'Outcomes',
    reports: [
      {
        id: 'offers',
        label: 'Offers',
        description: 'Acceptance, decline reasons and band position',
        icon: FileSignature,
        component: OffersReport,
      },
      {
        id: 'quality',
        label: 'Quality of hire',
        description: 'Retention, manager rating and ramp time',
        icon: Award,
        component: QualityReport,
      },
      {
        id: 'plan',
        label: 'Hiring plan',
        description: 'Targets vs hires by team and quarter',
        icon: Target,
        component: HiringPlanReport,
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
        component: DiversityReport,
      },
      {
        id: 'experience',
        label: 'Candidate experience',
        description: 'NPS, stage surveys and response SLAs',
        icon: HeartHandshake,
        component: CandidateExperienceReport,
      },
    ],
  },
];

const ALL_REPORTS = GROUPS.flatMap((g) => g.reports);

const DEPARTMENT_SHARE: Record<string, number> = {
  Engineering: 0.42,
  Product: 0.14,
  Design: 0.11,
  Data: 0.12,
  Sales: 0.13,
  People: 0.08,
};

const LOCATION_SHARE: Record<string, number> = {
  Bengaluru: 0.38,
  London: 0.16,
  Berlin: 0.1,
  Austin: 0.12,
  Singapore: 0.09,
  Remote: 0.15,
};

const RANGE_LABEL: Record<ReportRange, string> = {
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  '12m': 'Last 12 months',
};

function nudgeFor(key: string) {
  const hash = Array.from(key).reduce(
    (h, ch) => (h * 31 + ch.charCodeAt(0)) % 997,
    7,
  );
  return 1 + ((hash % 9) - 4) / 100;
}

const DEPARTMENTS = [
  'Engineering',
  'Product',
  'Design',
  'Data',
  'Sales',
  'People',
];
const LOCATIONS = [
  'Bengaluru',
  'London',
  'Berlin',
  'Austin',
  'Singapore',
  'Remote',
];

export default function ReportsPage() {
  const [reportId, setReportId] = useState('executive');
  const [range, setRange] = useState<ReportRange>('30d');
  const [department, setDepartment] = useState('all');
  const [location, setLocation] = useState('all');
  const report = ALL_REPORTS.find((r) => r.id === reportId) ?? ALL_REPORTS[0];
  const Report = report.component;
  const kpis = useRef<KpiRecord[]>([]);

  const scope = useMemo(
    () => ({
      rangeFactor: RANGE_FACTOR[range],
      filterFactor:
        (department === 'all' ? 1 : DEPARTMENT_SHARE[department]) *
        (location === 'all' ? 1 : LOCATION_SHARE[location]),
      rateNudge:
        department === 'all' && location === 'all' && range === '30d'
          ? 1
          : nudgeFor(`${department}-${location}-${range}`),
      kpis,
    }),
    [range, department, location],
  );

  const exportReport = (format: string) => {
    if (format === 'PDF') {
      window.print();
      return;
    }
    const rows: KpiRecord[] = [
      { label: 'Report', value: report.label },
      { label: 'Period', value: RANGE_LABEL[range] },
      { label: 'Department', value: department === 'all' ? 'All' : department },
      { label: 'Location', value: location === 'all' ? 'All' : location },
      ...kpis.current,
    ];
    downloadCsv(`${report.id}-report-${range}`, rows, [
      { header: 'Metric', value: (r) => r.label },
      {
        header: 'Value',
        value: (r) => (r.unit ? `${r.value} ${r.unit}` : r.value),
      },
      {
        header: 'Change vs previous period',
        value: (r) => (r.delta === undefined ? '' : `${r.delta}%`),
      },
    ]);
    toast.success(
      'Report exported',
      `${report.label}, ${RANGE_LABEL[range].toLowerCase()}`,
    );
  };

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
                  {r.label}
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
              <NotIntegratedBadge />
            </div>
            <p className="text-xs text-muted-foreground">
              {report.description} · {RANGE_LABEL[range].toLowerCase()}
              {department !== 'all' && ` · ${department}`}
              {location !== 'all' && ` · ${location}`} · compared with the
              previous period
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <FilterDropdown
              label="Department"
              value={department}
              onChange={setDepartment}
              options={[
                { label: 'All', value: 'all' },
                ...DEPARTMENTS.map((d) => ({ label: d, value: d })),
              ]}
            />
            <FilterDropdown
              label="Location"
              value={location}
              onChange={setLocation}
              options={[
                { label: 'All', value: 'all' },
                ...LOCATIONS.map((l) => ({ label: l, value: l })),
              ]}
            />
            <SegmentedControl
              value={range}
              onChange={setRange}
              options={[
                { value: '30d', label: '30 days' },
                { value: '90d', label: '90 days' },
                { value: '12m', label: '12 months' },
              ]}
            />
            <ExportButton formats={['CSV', 'PDF']} onExport={exportReport} />
          </div>
        </div>
        <ReportScopeContext.Provider value={scope}>
          <Report range={range} />
        </ReportScopeContext.Provider>
      </div>
    </div>
  );
}
