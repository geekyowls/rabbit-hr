'use client';

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
import type { ApplicationStage } from '@/types/application.type';
import type { Activity, ActivityType } from '@/types/activity.type';
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
  type PillTone,
} from '@/components/patterns';

type Range = '7d' | '14d' | '30d';

const RANGE_DAYS: Record<Range, number> = { '7d': 7, '14d': 14, '30d': 30 };

const TIME_TO_HIRE = {
  value: '26',
  unit: 'days',
  points: [29, 28, 28, 27, 27, 26, 26, 26],
};

const FUNNEL_STAGES: { stage: ApplicationStage; label: string }[] = [
  { stage: 'applied', label: 'Applied' },
  { stage: 'screening', label: 'Screening' },
  { stage: 'interview', label: 'Interview' },
  { stage: 'offer', label: 'Offer' },
  { stage: 'placed', label: 'Placed' },
];

const ACTIVITY_COLOR: Record<ActivityType, string> = {
  stage_change: '#4C6EF5',
  note: '#3F6650',
  email: '#E0A458',
  call: '#8B7DD8',
  created: '#16a34a',
  document: '#0ea5e9',
  task: '#a1a1aa',
};

const SOURCES = [
  { key: 'linkedin', label: 'LinkedIn', value: 38, color: '#3F6650' },
  { key: 'referral', label: 'Referrals', value: 22, color: '#8FBFA1' },
  { key: 'careers', label: 'Careers page', value: 19, color: '#4C6EF5' },
  { key: 'agency', label: 'Agencies', value: 12, color: '#E0A458' },
  { key: 'other', label: 'Other', value: 9, color: '#a1a1aa' },
];

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

const AGENDA: {
  time: string;
  name: string;
  role: string;
  stage: string;
  panel: string;
  tone: PillTone;
}[] = [
  {
    time: '10:00',
    name: 'Aarav Mehta',
    role: 'Backend Engineer',
    stage: 'Technical',
    panel: 'Rohit S, Priya K',
    tone: 'info',
  },
  {
    time: '11:30',
    name: 'Sophie Laurent',
    role: 'Product Designer',
    stage: 'Portfolio review',
    panel: 'Ana M',
    tone: 'purple',
  },
  {
    time: '13:00',
    name: 'Daniel Okafor',
    role: 'Data Analyst',
    stage: 'Phone screen',
    panel: 'Neha R',
    tone: 'neutral',
  },
  {
    time: '15:00',
    name: 'Ishita Rao',
    role: 'Product Manager',
    stage: 'Hiring manager',
    panel: 'Vikram J',
    tone: 'success',
  },
  {
    time: '16:30',
    name: 'Lucas Becker',
    role: 'DevOps Engineer',
    stage: 'Onsite loop',
    panel: '4 interviewers',
    tone: 'warning',
  },
];

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

const QUEUE = [
  {
    icon: Video,
    label: 'Scorecards to submit',
    value: 2,
    href: '/dashboard/interviews',
    urgent: true,
  },
  {
    icon: CalendarDays,
    label: 'Interviews to schedule',
    value: 7,
    href: '/dashboard/interviews',
    urgent: false,
  },
  {
    icon: FileSignature,
    label: 'Offers to approve',
    value: 1,
    href: '/dashboard/offers',
    urgent: false,
  },
];

const PLAN = [
  { team: 'Engineering', target: 12, hired: 8, offer: 2 },
  { team: 'Product', target: 3, hired: 2, offer: 0 },
  { team: 'Design', target: 2, hired: 1, offer: 1 },
  { team: 'Data', target: 3, hired: 1, offer: 0 },
  { team: 'Sales', target: 6, hired: 5, offer: 0 },
  { team: 'People', target: 1, hired: 1, offer: 0 },
];

const RECRUITERS = [
  {
    name: 'Neha Reddy',
    reqs: 5,
    active: 64,
    interviews: 14,
    overdue: 0,
    fill: 24,
  },
  {
    name: 'Olivia Brown',
    reqs: 4,
    active: 51,
    interviews: 11,
    overdue: 2,
    fill: 29,
  },
  {
    name: 'Arjun Nair',
    reqs: 6,
    active: 88,
    interviews: 19,
    overdue: 5,
    fill: 34,
  },
  {
    name: 'Emma Wilson',
    reqs: 3,
    active: 37,
    interviews: 8,
    overdue: 1,
    fill: 21,
  },
  {
    name: 'Kabir Shah',
    reqs: 2,
    active: 22,
    interviews: 6,
    overdue: 0,
    fill: 18,
  },
  {
    name: 'Ana Martins',
    reqs: 3,
    active: 45,
    interviews: 9,
    overdue: 3,
    fill: 31,
  },
];

const STARTS = [
  {
    name: 'Rohan Gupta',
    role: 'Product Manager, Growth',
    date: 'Mon 19 Oct',
    ready: 'Laptop shipped',
  },
  {
    name: 'Priya Nair',
    role: 'HR Business Partner',
    date: 'Mon 26 Oct',
    ready: 'Docs pending',
  },
  {
    name: 'Meera Pillai',
    role: 'Frontend Engineer',
    date: 'Mon 2 Nov',
    ready: 'Background check',
  },
];

const AGENT_IMPACT = [
  { label: 'Applications screened', value: '246' },
  { label: 'Interviews booked', value: '58' },
  { label: 'Recruiter hours saved', value: '31 h' },
  { label: 'Agreement with recruiters', value: '91%' },
];

function formatDay(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

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
  if (loading) return <Skeleton className="h-7 w-12" />;
  return <>{value === undefined ? '-' : value.toLocaleString('en-GB')}</>;
}

export default function DashboardPage() {
  const { user } = useSession();
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

  useEffect(() => {
    if (error) toast.error('Could not load dashboard', error.message);
  }, [error]);

  const funnel = useMemo(() => {
    const counts = new Map((data?.funnel ?? []).map((f) => [f.stage, f.count]));
    return FUNNEL_STAGES.map((s, i) => ({
      label: s.label,
      value: FUNNEL_STAGES.slice(i).reduce(
        (sum, later) => sum + (counts.get(later.stage) ?? 0),
        0,
      ),
    }));
  }, [data]);

  const appliedCount = data?.funnel.find((f) => f.stage === 'applied')?.count;

  const applications = useMemo(
    () =>
      (data?.applicationsPerDay ?? [])
        .slice(-RANGE_DAYS[range])
        .map((d) => ({ day: formatDay(d.date), applied: d.count })),
    [data, range],
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
    color: ACTIVITY_COLOR[a.type],
  }));
  const dateLabel = useMemo(
    () =>
      new Date().toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }),
    [],
  );

  return (
    <div className="space-y-4">
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
        {QUEUE.map((q) => (
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
              {q.value}
            </span>
            <NotIntegratedBadge label="" />
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
        <div className="relative">
          <TrendStat
            label="Time to hire"
            value={TIME_TO_HIRE.value}
            unit={TIME_TO_HIRE.unit}
            points={TIME_TO_HIRE.points}
            className="h-full p-4"
          />
          <NotIntegratedBadge label="" className="absolute right-3 top-3" />
        </div>
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
              {FUNNEL_STAGES.map((s) => (
                <Skeleton key={s.stage} className="h-9 w-full" />
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
                {applicationsTotal.toLocaleString('en-GB')} total
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
          subtitle="Share of applicants"
          bodyClassName="p-4"
          actions={<NotIntegratedBadge />}
        >
          <div className="flex items-center gap-5">
            <DonutChart
              data={SOURCES}
              size={150}
              centerValue="1,084"
              centerLabel="Applicants"
            />
            <div className="min-w-0 flex-1">
              <LegendDots
                items={SOURCES.map((s) => ({
                  color: s.color,
                  label: s.label,
                  value: `${s.value}%`,
                }))}
              />
            </div>
          </div>
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
          subtitle="Current load across the team"
          className="xl:col-span-2"
          bodyClassName="p-0"
          actions={<NotIntegratedBadge />}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Recruiter</th>
                  <th className="px-3 py-2 text-right font-medium">
                    Open reqs
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    Active candidates
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    Interviews this week
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    Overdue tasks
                  </th>
                  <th className="px-4 py-2 text-right font-medium">
                    Avg time to fill
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {RECRUITERS.map((r) => (
                  <tr key={r.name} className="hover:bg-muted/40">
                    <td className="px-4 py-2.5">
                      <span className="flex items-center gap-2">
                        <InitialsAvatar
                          name={r.name}
                          className="h-6 w-6 text-[10px]"
                        />
                        <span className="font-medium">{r.name}</span>
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {r.reqs}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span className="inline-flex items-center gap-2">
                        <span className="h-1.5 w-16 overflow-hidden rounded-sm bg-muted">
                          <span
                            className={cn(
                              'block h-full',
                              r.active > 80 ? 'bg-amber-500' : 'bg-[#3F6650]',
                            )}
                            style={{ width: `${Math.min(r.active, 100)}%` }}
                          />
                        </span>
                        <span className="w-6 tabular-nums">{r.active}</span>
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {r.interviews}
                    </td>
                    <td
                      className={cn(
                        'px-3 py-2.5 text-right tabular-nums',
                        r.overdue > 2 &&
                          'font-medium text-red-600 dark:text-red-400',
                      )}
                    >
                      {r.overdue}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {r.fill}d
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
          subtitle={`${AGENDA.length} scheduled`}
          bodyClassName="p-0"
          actions={
            <>
              <NotIntegratedBadge />
              <Link
                href="/dashboard/interviews"
                className="text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Calendar
              </Link>
            </>
          }
        >
          <ul className="divide-y divide-border">
            {AGENDA.map((a) => (
              <li key={a.time} className="flex items-center gap-3 px-4 py-2.5">
                <span className="w-11 shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                  {a.time}
                </span>
                <InitialsAvatar
                  name={a.name}
                  className="h-7 w-7 shrink-0 text-[11px]"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {a.role} · {a.panel}
                  </p>
                </div>
                <StatusPill tone={a.tone}>{a.stage}</StatusPill>
              </li>
            ))}
          </ul>
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
          subtitle="Accepted offers joining soon"
          bodyClassName="p-0"
          actions={<NotIntegratedBadge />}
        >
          <ul className="divide-y divide-border">
            {STARTS.map((st) => (
              <li key={st.name} className="flex items-center gap-3 px-4 py-2.5">
                <InitialsAvatar
                  name={st.name}
                  className="h-7 w-7 shrink-0 text-[11px]"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{st.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {st.role}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium tabular-nums">{st.date}</p>
                  <p className="text-xs text-muted-foreground">{st.ready}</p>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
