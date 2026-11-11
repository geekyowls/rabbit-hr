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
  ReportTable,
  thresholdColor,
  toneText,
} from './report-kit';

interface Recruiter {
  name: string;
  openReqs: number;
  moved: number;
  screens: number;
  hires: number;
  timeToFill: number;
  offerAccept: number;
  responseHours: number;
}

const RECRUITERS: Recruiter[] = [
  {
    name: 'Kavya Iyer',
    openReqs: 6,
    moved: 214,
    screens: 61,
    hires: 5,
    timeToFill: 31,
    offerAccept: 100,
    responseHours: 9,
  },
  {
    name: 'Arjun Nair',
    openReqs: 5,
    moved: 188,
    screens: 54,
    hires: 3,
    timeToFill: 28,
    offerAccept: 75,
    responseHours: 14,
  },
  {
    name: 'Rahul Menon',
    openReqs: 4,
    moved: 142,
    screens: 47,
    hires: 2,
    timeToFill: 36,
    offerAccept: 100,
    responseHours: 22,
  },
  {
    name: 'Olivia Brown',
    openReqs: 3,
    moved: 121,
    screens: 38,
    hires: 1,
    timeToFill: 41,
    offerAccept: 50,
    responseHours: 31,
  },
];

const ACTIVITY = [
  { name: 'Kavya', moved: 214, screens: 61, outreach: 138 },
  { name: 'Arjun', moved: 188, screens: 54, outreach: 162 },
  { name: 'Rahul', moved: 142, screens: 47, outreach: 96 },
  { name: 'Olivia', moved: 121, screens: 38, outreach: 74 },
];

export function RecruiterReport() {
  return (
    <div className="space-y-4">
      <KpiGrid>
        <TrendStat
          label="Reqs per recruiter"
          value="4.5"
          delta={12.5}
          invertDelta
          className="p-4"
        />
        <TrendStat
          label="Hires per recruiter"
          value="2.8"
          delta={16.7}
          className="p-4"
        />
        <TrendStat
          label="Candidates moved"
          value="665"
          delta={9.4}
          className="p-4"
        />
        <TrendStat
          label="Median response time"
          value="16"
          unit="hours"
          delta={-11.1}
          invertDelta
          className="p-4"
        />
      </KpiGrid>
      <SectionCard
        title="Recruiter leaderboard"
        subtitle="Last 90 days"
        bodyClassName="p-0"
      >
        <ReportTable
          rows={RECRUITERS}
          getKey={(r) => r.name}
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
              key: 'reqs',
              header: 'Open reqs',
              align: 'right',
              render: (r) => r.openReqs,
            },
            {
              key: 'moved',
              header: 'Candidates moved',
              align: 'right',
              render: (r) => r.moved,
            },
            {
              key: 'screens',
              header: 'Screens',
              align: 'right',
              render: (r) => r.screens,
            },
            {
              key: 'hires',
              header: 'Hires',
              align: 'right',
              render: (r) => <span className="font-semibold">{r.hires}</span>,
            },
            {
              key: 'ttf',
              header: 'Time to fill',
              align: 'right',
              render: (r) => (
                <span className={toneText(r.timeToFill, 32, 38, false)}>
                  {r.timeToFill} d
                </span>
              ),
            },
            {
              key: 'accept',
              header: 'Offer accept',
              align: 'right',
              render: (r) => (
                <BarWithValue
                  value={r.offerAccept}
                  color={thresholdColor(r.offerAccept, 85, 70)}
                />
              ),
            },
            {
              key: 'resp',
              header: 'Response time',
              align: 'right',
              render: (r) => (
                <span className={toneText(r.responseHours, 16, 24, false)}>
                  {r.responseHours} h
                </span>
              ),
            },
          ]}
        />
      </SectionCard>
      <Grid className="xl:grid-cols-2">
        <SectionCard
          title="Activity by recruiter"
          subtitle="Outreach, screens and stage moves"
          bodyClassName="p-4"
        >
          <BarSeriesChart
            data={ACTIVITY}
            xKey="name"
            height={240}
            showLegend
            series={[
              { key: 'outreach', label: 'Outreach', color: BRAND_LIGHT },
              { key: 'moved', label: 'Stage moves', color: BRAND },
              { key: 'screens', label: 'Screens', color: BLUE },
            ]}
          />
        </SectionCard>
        <SectionCard
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
        </SectionCard>
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

export function InterviewerReport() {
  return (
    <div className="space-y-4">
      <KpiGrid>
        <TrendStat
          label="Interviews held"
          value="142"
          delta={9.6}
          className="p-4"
        />
        <TrendStat
          label="Interviewer hours"
          value="168"
          delta={7.1}
          className="p-4"
        />
        <TrendStat
          label="Feedback on time"
          value="86"
          unit="%"
          delta={3.2}
          className="p-4"
        />
        <TrendStat
          label="Avg time to submit"
          value="15"
          unit="hours"
          delta={-9.0}
          invertDelta
          className="p-4"
        />
      </KpiGrid>
      <Grid className="xl:grid-cols-2">
        <SectionCard
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
        </SectionCard>
        <SectionCard
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
        </SectionCard>
      </Grid>
      <SectionCard
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
      </SectionCard>
    </div>
  );
}
