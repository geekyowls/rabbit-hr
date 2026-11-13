'use client';

import { useFormatters } from '@/hooks/use-formatters';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Briefcase,
  Building2,
  CalendarDays,
  Clock,
  Cpu,
  FileSignature,
  Gauge,
  ListTodo,
  UserCheck,
  UserPlus,
  Filter,
  PieChart,
  Users,
  Video,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useSession } from '@/contexts/session-context';
import { usePermissions } from '@/hooks/use-permissions';
import { useAtsDashboardQuery } from '@/hooks/queries';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';
import { toast } from '@/lib/toast';
import { Skeleton } from '@/components/ui/skeleton';
import { MyOpenTasks } from '@/components/tasks/my-open-tasks';
import { userDisplayName } from '@/components/tasks/task-utils';
import {
  SOURCE_LABEL,
  isClosedCategory,
  personName,
} from '@/components/applications/application-meta';
import { INTERVIEW_TYPE_LABEL } from '@/components/interviews/interview-data';
import { useHomeWidgets } from '@/components/dashboard/use-home-widgets';
import type { Activity } from '@/types/activity.type';
import { cn } from '@/lib/utils';
import { InitialsAvatar } from '@/components/ui/initials-avatar';
import {
  AreaSeriesChart,
  BarSeriesChart,
  DonutChart,
  EmptyState,
  FunnelChart,
  LegendDots,
  NotIntegratedBadge,
  SectionCard,
  SegmentedControl,
  StatusPill,
  Timeline,
  TrendStat,
} from '@/components/patterns';
import { OnboardingChecklistCard } from '@/components/onboarding/onboarding-checklist';

type Range = '7d' | '14d' | '30d';

const RANGE_DAYS: Record<Range, number> = { '7d': 7, '14d': 14, '30d': 30 };

const FUNNEL_SKELETON_ROWS = [0, 1, 2, 3, 4];

const ACTIVITY_COLOR: Record<string, string> = {
  stage_change: '#4C6EF5',
  note: '#3F6650',
  email: '#E0A458',
  call: '#8B7DD8',
  created: '#16a34a',
  document: '#0ea5e9',
  task: '#a1a1aa',
  interview: '#8B7DD8',
  offer: '#E0A458',
};

const DEFAULT_ACTIVITY_COLOR = '#a1a1aa';

const SOURCE_COLORS = [
  '#3F6650',
  '#8FBFA1',
  '#4C6EF5',
  '#E0A458',
  '#8B7DD8',
  '#3FB6A8',
  '#E06B6B',
  '#0ea5e9',
  '#a1a1aa',
];

function activityColor(activity: Activity) {
  const kind = activity.metadata?.kind;
  const key =
    typeof kind === 'string' && kind in ACTIVITY_COLOR ? kind : activity.type;
  return ACTIVITY_COLOR[key] ?? DEFAULT_ACTIVITY_COLOR;
}

const ATTENTION: {
  count: number;
  title: string;
  desc: string;
  href: string;
  tone: 'danger' | 'warn' | 'info';
}[] = [
  {
    count: 23,
    title: 'Applications not reviewed in 5+ days',
    desc: 'Frontend Engineer, Product Designer',
    href: '/dashboard/candidates',
    tone: 'danger',
  },
  {
    count: 6,
    title: 'Scorecards overdue',
    desc: 'Interviewers have not submitted feedback',
    href: '/dashboard/interviews',
    tone: 'warn',
  },
  {
    count: 3,
    title: 'Offers awaiting approval',
    desc: 'Pending with finance and hiring manager',
    href: '/dashboard/offers',
    tone: 'warn',
  },
  {
    count: 4,
    title: 'Candidates stuck in onsite',
    desc: 'No movement for more than 10 days',
    href: '/dashboard/pipeline',
    tone: 'info',
  },
];

const ATTENTION_TONE = {
  danger: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
  warn: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  info: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
};

const ROLES = [
  {
    title: 'Senior Backend Engineer',
    dept: 'Engineering',
    owner: 'Rohit Sharma',
    stages: [64, 22, 9, 4, 1],
    days: 21,
  },
  {
    title: 'Product Designer',
    dept: 'Design',
    owner: 'Ana Martins',
    stages: [118, 31, 12, 3, 1],
    days: 34,
  },
  {
    title: 'Data Analyst',
    dept: 'Data',
    owner: 'Neha Reddy',
    stages: [87, 26, 10, 2, 0],
    days: 12,
  },
  {
    title: 'Product Manager, Growth',
    dept: 'Product',
    owner: 'Vikram Joshi',
    stages: [143, 40, 15, 6, 2],
    days: 46,
  },
  {
    title: 'DevOps Engineer',
    dept: 'Engineering',
    owner: 'Rohit Sharma',
    stages: [41, 14, 6, 3, 0],
    days: 9,
  },
];

const STAGE_LABELS = ['Applied', 'Screen', 'Interview', 'Onsite', 'Offer'];

const PLAN = [
  { team: 'Engineering', target: 12, hired: 8, offer: 2 },
  { team: 'Product', target: 3, hired: 2, offer: 0 },
  { team: 'Design', target: 2, hired: 1, offer: 1 },
  { team: 'Data', target: 3, hired: 1, offer: 0 },
  { team: 'Sales', target: 6, hired: 5, offer: 0 },
  { team: 'People', target: 1, hired: 1, offer: 0 },
];

const AGENT_IMPACT = [
  { label: 'Applications screened', value: '246' },
  { label: 'Interviews booked', value: '58' },
  { label: 'Recruiter hours saved', value: '31 h' },
  { label: 'Agreement with recruiters', value: '91%' },
];

function activityMeta(activity: Activity) {
  const actor = userDisplayName(activity.actor);
  return [actor, activity.body].filter(Boolean).join(' · ');
}

function LiveValue({
  loading,
  value,
}: {
  loading: boolean;
  value: number | undefined;
}) {
  const fmt = useFormatters();
  if (loading) return <Skeleton className="h-7 w-12" />;
  return <>{value === undefined ? '-' : fmt.number(value)}</>;
}

export default function DashboardPage() {
  const { user } = useSession();
  const fmt = useFormatters();
  const { hasPermission } = usePermissions();
  const canViewDashboard = hasPermission(PERMISSIONS_ENUM.ATS_DASHBOARD_READ);
  const canCompleteTasks = hasPermission(PERMISSIONS_ENUM.TASK_UPDATE);
  const {
    data,
    isLoading: queryLoading,
    error,
  } = useAtsDashboardQuery(canViewDashboard);
  const isLoading = canViewDashboard && queryLoading;
  const [range, setRange] = useState<Range>('30d');
  const home = useHomeWidgets(RANGE_DAYS[range]);
  const report = home.report;
  const sourceTotal = (report?.sources ?? []).reduce(
    (sum, src) => sum + src.applications,
    0,
  );
  const sources = (report?.sources ?? [])
    .filter((src) => src.applications > 0)
    .map((src, i) => ({
      key: src.source,
      label: SOURCE_LABEL[src.source] ?? src.source,
      value: src.applications,
      hires: src.hires,
      color: SOURCE_COLORS[i % SOURCE_COLORS.length],
    }));
  const maxRecruiterApps = Math.max(
    1,
    ...(report?.recruiters ?? []).map((r) => r.applications),
  );

  const queue = [
    {
      icon: Video,
      label: 'Scorecards to submit',
      value: home.scorecardsDue,
      loading: home.scorecardsLoading,
      href: '/dashboard/interviews',
      urgent: true,
      enabled: home.canInterviews,
    },
    {
      icon: CalendarDays,
      label: `Interviews next ${home.scheduledWindowDays} days`,
      value: home.interviewsThisWeek,
      loading: home.interviewsThisWeekLoading,
      href: '/dashboard/interviews',
      urgent: false,
      enabled: home.canInterviews,
    },
    {
      icon: FileSignature,
      label: 'Offers to approve',
      value: home.offersToApprove.length,
      loading: home.offersToApproveLoading,
      href: '/dashboard/offers?status=pending_approval',
      urgent: home.offersToApprove.length > 0,
      enabled: home.canOffers,
    },
  ];

  useEffect(() => {
    if (error) toast.error('Could not load dashboard', error.message);
  }, [error]);

  const funnel = useMemo(() => {
    const stages = (data?.funnel ?? []).filter(
      (f) => !isClosedCategory(f.category),
    );
    return stages.map((s, i) => ({
      label: s.name,
      value: stages.slice(i).reduce((sum, later) => sum + later.count, 0),
    }));
  }, [data]);

  const appliedCount = data?.funnel
    .filter((f) => f.category === 'applied')
    .reduce((sum, f) => sum + f.count, 0);

  const applications = useMemo(
    () =>
      (data?.applicationsPerDay ?? []).slice(-RANGE_DAYS[range]).map((d) => ({
        day: fmt.dateLong(d.date, { day: 'numeric', month: 'short' }),
        applied: d.count,
      })),
    [data, range, fmt],
  );

  const applicationsTotal = applications.reduce((sum, d) => sum + d.applied, 0);

  const kpis = [
    { label: 'Open jobs', value: data?.totals.openJobs },
    { label: 'Candidates', value: data?.totals.candidates },
    { label: 'Active applications', value: data?.totals.activeApplications },
    { label: 'Placements this month', value: data?.totals.placementsThisMonth },
    { label: 'In interview', value: data?.totals.interviews },
  ];

  const activity = (data?.recentActivities ?? []).map((a) => ({
    id: a.id,
    title: a.title,
    meta: activityMeta(a),
    time: formatDistanceToNow(new Date(a.createdAt), { addSuffix: true }),
    color: activityColor(a),
  }));
  const dateLabel = useMemo(
    () =>
      fmt.dateLong(new Date(), {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }),
    [fmt],
  );

  return (
    <div className="space-y-4">
      <OnboardingChecklistCard />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            {dateLabel}
          </p>
          <h1 className="text-xl font-semibold tracking-tight">
            Good to see you{user?.firstName ? `, ${user.firstName}` : ''}
          </h1>
        </div>
        <SegmentedControl
          value={range}
          onChange={setRange}
          options={[
            { value: '7d', label: '7 days' },
            { value: '14d', label: '14 days' },
            { value: '30d', label: '30 days' },
          ]}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Link
          href="/dashboard/pipeline"
          className="group flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 hover:border-[#3F6650]/40 hover:bg-muted/40"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
            <Users className="h-4 w-4 text-muted-foreground" />
          </span>
          <span className="min-w-0 flex-1 truncate text-sm">
            Applications to review
          </span>
          <span className="text-base font-semibold tabular-nums text-[#3F6650] dark:text-[#8FBFA1]">
            {isLoading ? (
              <Skeleton className="h-5 w-6" />
            ) : (
              (appliedCount ?? '-')
            )}
          </span>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </Link>
        {queue.map((q) => (
          <Link
            key={q.label}
            href={q.href}
            className="group flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 hover:border-[#3F6650]/40 hover:bg-muted/40"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
              <q.icon className="h-4 w-4 text-muted-foreground" />
            </span>
            <span className="min-w-0 flex-1 truncate text-sm">{q.label}</span>
            <span
              className={cn(
                'text-base font-semibold tabular-nums',
                q.urgent && 'text-[#3F6650] dark:text-[#8FBFA1]',
              )}
            >
              {q.loading ? (
                <Skeleton className="h-5 w-6" />
              ) : q.enabled && q.value !== undefined ? (
                fmt.number(q.value)
              ) : (
                '-'
              )}
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <TrendStat
            key={k.label}
            label={k.label}
            value={<LiveValue loading={isLoading} value={k.value} />}
            className="p-4"
          />
        ))}
        <TrendStat
          label="Time to hire"
          value={
            home.reportLoading ? (
              <Skeleton className="h-7 w-12" />
            ) : report?.timeToHire.medianDays != null ? (
              fmt.number(report.timeToHire.medianDays)
            ) : (
              '-'
            )
          }
          unit={
            report?.timeToHire.medianDays != null
              ? `days median, ${fmt.number(report.timeToHire.hires)} hires`
              : 'no hires in range'
          }
          className="h-full p-4"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard
          icon={Filter}
          title="Hiring funnel"
          subtitle="Applications that reached each stage, conversion from previous stage"
          className="xl:col-span-2"
          bodyClassName="p-4"
          actions={
            <Link
              href="/dashboard/pipeline"
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Pipeline
            </Link>
          }
        >
          {isLoading ? (
            <div className="space-y-2">
              {FUNNEL_SKELETON_ROWS.map((row) => (
                <Skeleton key={row} className="h-9 w-full" />
              ))}
            </div>
          ) : (
            <FunnelChart stages={funnel} />
          )}
        </SectionCard>

        <SectionCard
          icon={AlertCircle}
          title="Needs attention"
          bodyClassName="p-0"
          actions={<NotIntegratedBadge />}
        >
          <ul className="divide-y divide-border">
            {ATTENTION.map((a) => (
              <li key={a.title}>
                <Link
                  href={a.href}
                  className="group flex items-start gap-3 px-4 py-3 hover:bg-muted/40"
                >
                  <span
                    className={cn(
                      'mt-0.5 inline-flex h-6 min-w-6 items-center justify-center rounded px-1.5 text-xs font-semibold tabular-nums',
                      ATTENTION_TONE[a.tone],
                    )}
                  >
                    {a.count}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {a.desc}
                    </p>
                  </div>
                  <ArrowRight className="mt-1 h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard
          icon={BarChart3}
          title="Applications"
          subtitle={`New applications per day, last ${RANGE_DAYS[range]} days`}
          className="xl:col-span-2"
          bodyClassName="p-4"
          actions={
            !isLoading && (
              <span className="text-xs tabular-nums text-muted-foreground">
                {fmt.number(applicationsTotal)} total
              </span>
            )
          }
        >
          {isLoading ? (
            <Skeleton className="h-[240px] w-full" />
          ) : (
            <AreaSeriesChart
              data={applications}
              xKey="day"
              height={240}
              series={[
                { key: 'applied', label: 'Applications', color: '#3F6650' },
              ]}
            />
          )}
        </SectionCard>

        <SectionCard
          icon={PieChart}
          title="Source of hire"
          subtitle={`Applications and hires, last ${RANGE_DAYS[range]} days`}
          bodyClassName="p-4"
        >
          {home.reportLoading ? (
            <Skeleton className="h-[150px] w-full" />
          ) : sources.length === 0 ? (
            <EmptyState
              compact
              icon={<PieChart className="h-6 w-6" />}
              title="No applications in this range"
              description="Sources appear once candidates apply"
            />
          ) : (
            <div className="flex items-center gap-5">
              <DonutChart
                data={sources}
                size={150}
                centerValue={fmt.number(sourceTotal)}
                centerLabel="Applications"
              />
              <div className="min-w-0 flex-1">
                <LegendDots
                  items={sources.map((src) => ({
                    color: src.color,
                    label: src.label,
                    value: `${Math.round((src.value / sourceTotal) * 100)}%, ${fmt.number(src.hires)} hired`,
                  }))}
                />
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard
          icon={Building2}
          title="Applications by client"
          subtitle="Top clients by total applications"
          className="xl:col-span-2"
          bodyClassName="p-4"
          actions={
            <Link
              href="/dashboard/clients"
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              All clients
            </Link>
          }
        >
          {isLoading ? (
            <Skeleton className="h-[240px] w-full" />
          ) : data && data.applicationsByClient.length > 0 ? (
            <BarSeriesChart
              data={data.applicationsByClient}
              xKey="clientName"
              horizontal
              height={Math.max(160, data.applicationsByClient.length * 34)}
              series={[
                { key: 'count', label: 'Applications', color: '#3F6650' },
              ]}
            />
          ) : (
            <EmptyState
              compact
              icon={<Building2 className="h-6 w-6" />}
              title="No client applications yet"
              description="Applications to client jobs will show up here"
            />
          )}
        </SectionCard>

        <SectionCard
          icon={ListTodo}
          title="My open tasks"
          subtitle="Assigned to you, soonest first"
          bodyClassName="p-0"
          actions={
            <Link
              href="/dashboard/tasks"
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              All tasks
            </Link>
          }
        >
          {isLoading ? (
            <div className="space-y-2 p-4">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            <MyOpenTasks
              tasks={data?.myOpenTasks ?? []}
              canComplete={canCompleteTasks}
            />
          )}
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard
          icon={Gauge}
          title="Hiring plan"
          subtitle="Q4 hires against target"
          bodyClassName="space-y-3 p-4"
          actions={<NotIntegratedBadge />}
        >
          {PLAN.map((g) => (
            <div key={g.team} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{g.team}</span>
                <span className="tabular-nums text-muted-foreground">
                  {g.hired}
                  {g.offer > 0 && (
                    <span className="text-[#3F6650] dark:text-[#8FBFA1]">
                      {' '}
                      +{g.offer}
                    </span>
                  )}{' '}
                  / {g.target}
                </span>
              </div>
              <div className="flex h-1.5 overflow-hidden rounded-sm bg-muted">
                <div
                  className="h-full bg-[#3F6650]"
                  style={{ width: `${(g.hired / g.target) * 100}%` }}
                />
                <div
                  className="h-full bg-[#8FBFA1]"
                  style={{ width: `${(g.offer / g.target) * 100}%` }}
                />
              </div>
            </div>
          ))}
          <div className="flex items-center gap-4 pt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-[#3F6650]" />
              Hired
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-[#8FBFA1]" />
              In offer
            </span>
          </div>
        </SectionCard>

        <SectionCard
          icon={UserCheck}
          title="Recruiter workload"
          subtitle={`Jobs owned and outcomes, last ${RANGE_DAYS[range]} days`}
          className="xl:col-span-2"
          bodyClassName="p-0"
          actions={
            <Link
              href="/dashboard/reports"
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Reports
            </Link>
          }
        >
          {home.reportLoading ? (
            <div className="space-y-2 p-4">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (report?.recruiters ?? []).length === 0 ? (
            <EmptyState
              compact
              icon={<UserCheck className="h-6 w-6" />}
              title="No recruiter activity"
              description="Assign recruiters to jobs to see their workload"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-4 py-2 font-medium">Recruiter</th>
                    <th className="px-3 py-2 text-right font-medium">Jobs</th>
                    <th className="px-3 py-2 text-right font-medium">
                      Applications
                    </th>
                    <th className="px-3 py-2 text-right font-medium">
                      Interviews
                    </th>
                    <th className="px-3 py-2 text-right font-medium">Offers</th>
                    <th className="px-4 py-2 text-right font-medium">Hires</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(report?.recruiters ?? []).map((r) => {
                    const name = personName(r.recruiter) || r.recruiter.email;
                    return (
                      <tr key={r.recruiter.id} className="hover:bg-muted/40">
                        <td className="px-4 py-2.5">
                          <span className="flex items-center gap-2">
                            <InitialsAvatar
                              name={name}
                              className="h-6 w-6 text-[10px]"
                            />
                            <span className="font-medium">{name}</span>
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {fmt.number(r.jobs)}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <span className="inline-flex items-center gap-2">
                            <span className="h-1.5 w-16 overflow-hidden rounded-sm bg-muted">
                              <span
                                className="block h-full bg-[#3F6650] dark:bg-[#8FBFA1]"
                                style={{
                                  width: `${(r.applications / maxRecruiterApps) * 100}%`,
                                }}
                              />
                            </span>
                            <span className="w-8 tabular-nums">
                              {fmt.number(r.applications)}
                            </span>
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {fmt.number(r.interviews)}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {fmt.number(r.offers)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                          {fmt.number(r.hires)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard
          icon={Briefcase}
          title="Open roles"
          subtitle="Candidates in each stage"
          className="xl:col-span-2"
          bodyClassName="p-0"
          actions={
            <>
              <NotIntegratedBadge />
              <Link
                href="/dashboard/jobs"
                className="text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                All jobs
              </Link>
            </>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Role</th>
                  {STAGE_LABELS.map((s) => (
                    <th key={s} className="px-2 py-2 text-right font-medium">
                      {s}
                    </th>
                  ))}
                  <th className="px-4 py-2 text-right font-medium">Open for</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ROLES.map((r) => (
                  <tr key={r.title} className="hover:bg-muted/40">
                    <td className="px-4 py-2.5">
                      <p className="font-medium">{r.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.dept} · {r.owner}
                      </p>
                    </td>
                    {r.stages.map((n, i) => (
                      <td
                        key={STAGE_LABELS[i]}
                        className={cn(
                          'px-2 py-2.5 text-right tabular-nums',
                          n === 0 && 'text-muted-foreground',
                        )}
                      >
                        {n}
                      </td>
                    ))}
                    <td
                      className={cn(
                        'px-4 py-2.5 text-right tabular-nums',
                        r.days > 30 && 'text-amber-600 dark:text-amber-400',
                      )}
                    >
                      {r.days}d
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard
          icon={CalendarDays}
          title="Today's interviews"
          subtitle={
            home.todaysInterviewsLoading
              ? 'Loading'
              : `${home.todaysInterviews.length} scheduled`
          }
          bodyClassName="p-0"
          actions={
            <Link
              href="/dashboard/interviews"
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Calendar
            </Link>
          }
        >
          {home.todaysInterviewsLoading ? (
            <div className="space-y-2 p-4">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : home.todaysInterviews.length === 0 ? (
            <EmptyState
              compact
              icon={<CalendarDays className="h-6 w-6" />}
              title="No interviews today"
              description="Scheduled interviews for today show up here"
            />
          ) : (
            <ul className="divide-y divide-border">
              {home.todaysInterviews.map((iv) => {
                const name = personName(iv.candidate) || iv.candidate.email;
                const panel =
                  iv.interviewers.length > 2
                    ? `${iv.interviewers.length} interviewers`
                    : iv.interviewers.map((u) => userDisplayName(u)).join(', ');
                return (
                  <li key={iv.id}>
                    <Link
                      href={`/dashboard/interviews?id=${iv.id}`}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40"
                    >
                      <span className="w-14 shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                        {fmt.time(iv.scheduledAt)}
                      </span>
                      <InitialsAvatar
                        name={name}
                        className="h-7 w-7 shrink-0 text-[11px]"
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            'truncate text-sm font-medium',
                            iv.status === 'cancelled' &&
                              'text-muted-foreground line-through',
                          )}
                        >
                          {name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {[iv.job.title, panel].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <StatusPill
                        tone={iv.status === 'scheduled' ? 'info' : 'neutral'}
                      >
                        {INTERVIEW_TYPE_LABEL[iv.type] ?? iv.title}
                      </StatusPill>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard icon={Clock} title="Recent activity" bodyClassName="p-4">
          {isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : activity.length > 0 ? (
            <Timeline entries={activity} />
          ) : (
            <EmptyState
              compact
              icon={<Clock className="h-6 w-6" />}
              title="No activity yet"
              description="Notes, stage changes and emails will appear here"
            />
          )}
        </SectionCard>

        <SectionCard
          icon={Cpu}
          title="Agents this week"
          subtitle="Work done by your recruiting agents"
          bodyClassName="space-y-3 p-4"
          actions={
            <>
              <NotIntegratedBadge />
              <Link
                href="/dashboard/agents"
                className="text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Manage
              </Link>
            </>
          }
        >
          <div className="grid grid-cols-2 gap-2">
            {AGENT_IMPACT.map((a) => (
              <div
                key={a.label}
                className="rounded-md border border-border px-3 py-2"
              >
                <p className="text-lg font-semibold tabular-nums">{a.value}</p>
                <p className="text-xs text-muted-foreground">{a.label}</p>
              </div>
            ))}
          </div>
          <Link
            href="/dashboard/agents"
            className="flex items-center justify-between rounded-md bg-[#EDF1EE] px-3 py-2 text-sm text-[#3F6650] hover:bg-[#E2EAE4] dark:bg-[#3F6650]/20 dark:text-[#8FBFA1]"
          >
            <span>5 recommendations waiting for review</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </SectionCard>

        <SectionCard
          icon={UserPlus}
          title="Upcoming starts"
          subtitle={`Accepted offers starting in the next ${home.upcomingStartDays} days`}
          bodyClassName="p-0"
          actions={
            <Link
              href="/dashboard/offers?status=accepted"
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Offers
            </Link>
          }
        >
          {home.upcomingStartsLoading ? (
            <div className="space-y-2 p-4">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : home.upcomingStarts.length === 0 ? (
            <EmptyState
              compact
              icon={<UserPlus className="h-6 w-6" />}
              title="No upcoming starts"
              description="Accepted offers with a start date appear here"
            />
          ) : (
            <ul className="divide-y divide-border">
              {home.upcomingStarts.map((o) => {
                const name = personName(o.candidate) || o.candidate.email;
                const days = home.daysUntil(o.startDate ?? '');
                return (
                  <li key={o.id}>
                    <Link
                      href={`/dashboard/offers?id=${o.id}`}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40"
                    >
                      <InitialsAvatar
                        name={name}
                        className="h-7 w-7 shrink-0 text-[11px]"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {o.title}
                          {o.client ? ` · ${o.client.name}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium tabular-nums">
                          {fmt.dateLong(o.startDate, {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {days === 0
                            ? 'Today'
                            : days === 1
                              ? 'Tomorrow'
                              : `In ${days} days`}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
