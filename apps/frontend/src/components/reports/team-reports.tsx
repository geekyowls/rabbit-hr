'use client';

import {
  BarSeriesChart,
  HeatmapGrid,
  SectionCard,
  StatusPill,
  TrendStat,
} from '@/components/patterns';
import { InitialsAvatar } from '@/components/ui/initials-avatar';
import {
  AMBER,
  BLUE,
  BRAND,
  BRAND_LIGHT,
  BarWithValue,
  Grid,
  KpiGrid,
  EmptyReport,
  GRAY,
  PreviewCard,
  RED,
  ReportTable,
  SplitBar,
  changePct,
  pointsChange,
  rateLabel,
  ratio,
  thresholdColor,
  toneText,
  type LiveReportProps,
} from './report-kit';
import { useFormatters } from '@/hooks/use-formatters';
import { personName } from '@/components/applications/application-meta';

export function RecruiterReport({ data, previous }: LiveReportProps) {
  const f = useFormatters();
  const rows = data.recruiters.map((r) => ({
    ...r,
    name: personName(r.recruiter) || r.recruiter.email,
  }));
  const count = rows.length;
  const avg = (key: 'hires' | 'applications' | 'jobs') =>
    count
      ? Math.round((rows.reduce((s, r) => s + r[key], 0) / count) * 10) / 10
      : null;
  const prevCount = previous?.recruiters.length ?? 0;
  const prevHires = prevCount
    ? Math.round(
        ((previous?.recruiters ?? []).reduce((s, r) => s + r.hires, 0) /
          prevCount) *
          10,
      ) / 10
    : null;

  return (
    <div className="space-y-4">
      <KpiGrid>
        <TrendStat label="Recruiters" value={f.number(count)} className="p-4" />
        <TrendStat
          label="Jobs per recruiter"
          value={avg('jobs') ?? '-'}
          className="p-4"
        />
        <TrendStat
          label="Applications per recruiter"
          value={avg('applications') ?? '-'}
          className="p-4"
        />
        <TrendStat
          label="Hires per recruiter"
          value={avg('hires') ?? '-'}
          delta={changePct(avg('hires'), prevHires)}
          className="p-4"
        />
      </KpiGrid>
      <SectionCard
        title="Recruiter leaderboard"
        subtitle="Jobs where the recruiter or owner is assigned"
        bodyClassName="p-0"
      >
        {rows.length === 0 ? (
          <EmptyReport text="No recruiter activity in this period" />
        ) : (
          <ReportTable
            rows={rows}
            getKey={(r) => r.recruiter.id}
            columns={[
              {
                key: 'name',
                header: 'Recruiter',
                render: (r) => (
                  <span className="inline-flex items-center gap-2 font-medium">
                    <InitialsAvatar
                      name={r.name}
                      className="h-6 w-6 text-[10px]"
                    />
                    {r.name}
                  </span>
                ),
              },
              {
                key: 'jobs',
                header: 'Jobs',
                align: 'right',
                render: (r) => f.number(r.jobs),
              },
              {
                key: 'applications',
                header: 'Applications',
                align: 'right',
                render: (r) => f.number(r.applications),
              },
              {
                key: 'interviews',
                header: 'Interviews',
                align: 'right',
                render: (r) => f.number(r.interviews),
              },
              {
                key: 'offers',
                header: 'Offers',
                align: 'right',
                render: (r) => f.number(r.offers),
              },
              {
                key: 'hires',
                header: 'Hires',
                align: 'right',
                render: (r) => (
                  <span className="font-semibold">{f.number(r.hires)}</span>
                ),
              },
              {
                key: 'rate',
                header: 'Hire rate',
                align: 'right',
                render: (r) => {
                  const rate = ratio(r.hires, r.applications);
                  return rate == null ? (
                    '-'
                  ) : (
                    <BarWithValue
                      value={rate}
                      max={Math.max(10, rate)}
                      color={thresholdColor(rate, 5, 2)}
                    />
                  );
                },
              },
            ]}
          />
        )}
      </SectionCard>
      <Grid className="xl:grid-cols-2">
        <SectionCard
          title="Activity by recruiter"
          subtitle="Interviews, offers and hires"
          bodyClassName="p-4"
        >
          {rows.length === 0 ? (
            <EmptyReport text="No recruiter activity in this period" />
          ) : (
            <BarSeriesChart
              data={rows.map((r) => ({
                name: r.name.split(' ')[0],
                interviews: r.interviews,
                offers: r.offers,
                hires: r.hires,
              }))}
              xKey="name"
              height={240}
              showLegend
              series={[
                { key: 'interviews', label: 'Interviews', color: BRAND_LIGHT },
                { key: 'offers', label: 'Offers', color: BLUE },
                { key: 'hires', label: 'Hires', color: BRAND },
              ]}
            />
          )}
        </SectionCard>
        <PreviewCard
          title="Workload balance"
          subtitle="Active candidates per recruiter by stage"
          bodyClassName="p-4"
        >
          <HeatmapGrid
            columns={['Review', 'Screen', 'Phone', 'Onsite', 'Offer']}
            rows={[
              { label: 'Kavya', values: [42, 26, 14, 9, 2] },
              { label: 'Arjun', values: [38, 22, 11, 7, 1] },
              { label: 'Rahul', values: [51, 18, 8, 6, 1] },
              { label: 'Olivia', values: [29, 12, 6, 3, 0] },
            ]}
          />
        </PreviewCard>
      </Grid>
    </div>
  );
}

interface Interviewer {
  name: string;
  team: string;
  interviews: number;
  hours: number;
  onTime: number;
  avgHours: number;
  passRate: number;
}

const TEAM_AVG_PASS = 36;

const INTERVIEWERS: Interviewer[] = [
  {
    name: 'Priya Kapoor',
    team: 'Engineering',
    interviews: 24,
    hours: 26,
    onTime: 96,
    avgHours: 6,
    passRate: 38,
  },
  {
    name: 'Rohit Sharma',
    team: 'Engineering',
    interviews: 21,
    hours: 24,
    onTime: 81,
    avgHours: 22,
    passRate: 29,
  },
  {
    name: 'Ana Martins',
    team: 'Design',
    interviews: 17,
    hours: 15,
    onTime: 100,
    avgHours: 4,
    passRate: 41,
  },
  {
    name: 'Neha Reddy',
    team: 'Data',
    interviews: 15,
    hours: 12,
    onTime: 73,
    avgHours: 31,
    passRate: 33,
  },
  {
    name: 'Vikram Joshi',
    team: 'Product',
    interviews: 12,
    hours: 11,
    onTime: 92,
    avgHours: 9,
    passRate: 50,
  },
  {
    name: 'Kabir Shah',
    team: 'Engineering',
    interviews: 11,
    hours: 14,
    onTime: 64,
    avgHours: 40,
    passRate: 18,
  },
  {
    name: 'Emma Wilson',
    team: 'Engineering',
    interviews: 9,
    hours: 12,
    onTime: 89,
    avgHours: 11,
    passRate: 44,
  },
  {
    name: 'Olivia Brown',
    team: 'Sales',
    interviews: 8,
    hours: 6,
    onTime: 100,
    avgHours: 3,
    passRate: 63,
  },
];

export function InterviewerReport({ data, previous }: LiveReportProps) {
  const f = useFormatters();
  const iv = data.interviews;
  const outcomes = [
    { key: 'completed', label: 'Completed', value: iv.completed, color: BRAND },
    {
      key: 'scheduled',
      label: 'Still scheduled',
      value: Math.max(
        0,
        iv.scheduled - iv.completed - iv.cancelled - iv.noShow,
      ),
      color: BRAND_LIGHT,
    },
    { key: 'cancelled', label: 'Cancelled', value: iv.cancelled, color: GRAY },
    { key: 'noShow', label: 'No show', value: iv.noShow, color: RED },
  ];
  return (
    <div className="space-y-4">
      <KpiGrid>
        <TrendStat
          label="Interviews scheduled"
          value={f.number(iv.scheduled)}
          delta={changePct(iv.scheduled, previous?.interviews.scheduled)}
          className="p-4"
        />
        <TrendStat
          label="Completed"
          value={f.number(iv.completed)}
          delta={changePct(iv.completed, previous?.interviews.completed)}
          className="p-4"
        />
        <TrendStat
          label="No-show rate"
          value={rateLabel(iv.noShowRate)}
          delta={pointsChange(iv.noShowRate, previous?.interviews.noShowRate)}
          invertDelta
          className="p-4"
        />
        <TrendStat
          label="Average rating"
          value={iv.averageRating ?? '-'}
          unit={
            iv.averageRating == null
              ? undefined
              : `of 5, ${f.number(iv.scorecards)} scorecards`
          }
          className="p-4"
        />
      </KpiGrid>
      <SectionCard
        title="Interview outcomes"
        subtitle="Interviews scheduled in this period"
        bodyClassName="space-y-3 p-4"
      >
        {iv.scheduled === 0 ? (
          <EmptyReport text="No interviews in this period" />
        ) : (
          <>
            <SplitBar parts={outcomes} />
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              {outcomes.map((o) => (
                <span key={o.key} className="inline-flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-sm"
                    style={{ backgroundColor: o.color }}
                  />
                  {o.label}
                  <span className="font-medium tabular-nums text-foreground">
                    {f.number(o.value)}
                  </span>
                </span>
              ))}
            </div>
          </>
        )}
      </SectionCard>
      <Grid className="xl:grid-cols-2">
        <PreviewCard
          title="Interview load"
          subtitle="Interviews per person, last 90 days"
          bodyClassName="p-4"
        >
          <BarSeriesChart
            data={INTERVIEWERS.map((i) => ({
              name: i.name.split(' ')[0],
              interviews: i.interviews,
            }))}
            xKey="name"
            horizontal
            height={260}
            series={[{ key: 'interviews', label: 'Interviews', color: BRAND }]}
          />
        </PreviewCard>
        <PreviewCard
          title="Pass rate calibration"
          subtitle={`Difference from team average of ${TEAM_AVG_PASS}%`}
          bodyClassName="space-y-2.5 p-4"
        >
          {INTERVIEWERS.map((i) => {
            const diff = i.passRate - TEAM_AVG_PASS;
            const width = Math.min(Math.abs(diff) * 2, 50);
            return (
              <div key={i.name} className="flex items-center gap-3 text-sm">
                <span className="w-28 shrink-0 truncate">{i.name}</span>
                <div className="relative h-4 flex-1">
                  <span className="absolute left-1/2 top-0 h-full w-px bg-border" />
                  <span
                    className="absolute top-0.5 h-3 rounded-sm"
                    style={{
                      width: `${width}%`,
                      left: diff >= 0 ? '50%' : `${50 - width}%`,
                      backgroundColor: Math.abs(diff) > 12 ? AMBER : BRAND,
                    }}
                  />
                </div>
                <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">
                  {diff > 0 ? '+' : ''}
                  {diff} pts
                </span>
              </div>
            );
          })}
        </PreviewCard>
      </Grid>
      <PreviewCard
        title="Interviewer scorecards"
        subtitle="Feedback SLA is 24 hours"
        bodyClassName="p-0"
      >
        <ReportTable
          rows={INTERVIEWERS}
          getKey={(r) => r.name}
          columns={[
            {
              key: 'name',
              header: 'Interviewer',
              render: (r) => (
                <span className="inline-flex items-center gap-2 font-medium">
                  <InitialsAvatar
                    name={r.name}
                    className="h-6 w-6 text-[10px]"
                  />
                  {r.name}
                </span>
              ),
            },
            { key: 'team', header: 'Team', render: (r) => r.team },
            {
              key: 'interviews',
              header: 'Interviews',
              align: 'right',
              render: (r) => r.interviews,
            },
            {
              key: 'hours',
              header: 'Hours',
              align: 'right',
              render: (r) => r.hours,
            },
            {
              key: 'ontime',
              header: 'On time',
              align: 'right',
              render: (r) => (
                <BarWithValue
                  value={r.onTime}
                  color={thresholdColor(r.onTime, 90, 75)}
                />
              ),
            },
            {
              key: 'avg',
              header: 'Avg submit',
              align: 'right',
              render: (r) => (
                <span className={toneText(r.avgHours, 12, 24, false)}>
                  {r.avgHours} h
                </span>
              ),
            },
            {
              key: 'pass',
              header: 'Pass rate',
              align: 'right',
              render: (r) => `${r.passRate}%`,
            },
            {
              key: 'flag',
              header: 'Flag',
              render: (r) =>
                r.avgHours > 24 ? (
                  <StatusPill tone="danger">Late feedback</StatusPill>
                ) : Math.abs(r.passRate - TEAM_AVG_PASS) > 12 ? (
                  <StatusPill tone="warning">Calibration</StatusPill>
                ) : (
                  <span className="text-muted-foreground">-</span>
                ),
            },
          ]}
        />
      </PreviewCard>
    </div>
  );
}
