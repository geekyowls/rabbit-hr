'use client';

import {
  BarSeriesChart,
  FunnelChart,
  LineSeriesChart,
  RankedBarList,
  SectionCard,
  StatusPill,
  TrendStat,
  type PillTone,
} from '@/components/patterns';
import { InitialsAvatar } from '@/components/ui/initials-avatar';
import {
  AMBER,
  BLUE,
  BRAND,
  BRAND_LIGHT,
  BarWithValue,
  GRAY,
  Grid,
  KpiGrid,
  MONTHS,
  EmptyReport,
  PreviewCard,
  RED,
  ReportTable,
  changePct,
  daysLabel,
  flowFunnel,
  rateLabel,
  ratio,
  thresholdColor,
  toneText,
  type LiveReportProps,
} from './report-kit';
import { useFormatters } from '@/hooks/use-formatters';
import { STAGE_CATEGORY_LABEL } from '@/components/applications/application-meta';

const STAGE_BY_DEPT = [
  { dept: 'Engineering', screen: 148, phone: 71, onsite: 34, offer: 8 },
  { dept: 'Product', screen: 61, phone: 30, onsite: 14, offer: 3 },
  { dept: 'Design', screen: 52, phone: 24, onsite: 11, offer: 2 },
  { dept: 'Data', screen: 44, phone: 19, onsite: 9, offer: 1 },
  { dept: 'Sales', screen: 39, phone: 22, onsite: 6, offer: 1 },
  { dept: 'People', screen: 18, phone: 8, onsite: 3, offer: 0 },
];

export function FunnelReport({ data }: LiveReportProps) {
  const f = useFormatters();
  const funnel = flowFunnel(data);
  const firstStage = data.funnel[0];
  const offerStage = data.funnel.find((s) => s.category === 'offer');
  const rejections = data.rejectionReasons.reduce((sum, r) => sum + r.count, 0);
  const reasons = data.rejectionReasons.map((r, i) => ({
    label: r.reason,
    value: r.count,
    color: REASON_COLORS[i % REASON_COLORS.length],
  }));

  return (
    <div className="space-y-4">
      <KpiGrid>
        <TrendStat
          label="Application to hire"
          value={rateLabel(ratio(data.totals.hires, data.totals.applications))}
          className="p-4"
        />
        <TrendStat
          label={
            firstStage
              ? `${firstStage.name} pass rate`
              : 'First stage pass rate'
          }
          value={rateLabel(firstStage?.conversionToNext)}
          className="p-4"
        />
        <TrendStat
          label="Offer to hire"
          value={rateLabel(offerStage?.conversionToNext)}
          className="p-4"
        />
        <TrendStat
          label="Rejections"
          value={f.number(rejections)}
          className="p-4"
        />
      </KpiGrid>
      <Grid className="xl:grid-cols-2">
        <SectionCard
          title="Stage pass-through"
          subtitle="Applications that reached each stage, conversion from previous stage"
          bodyClassName="p-4"
        >
          {funnel.length === 0 ? (
            <EmptyReport text="No pipeline stages configured" />
          ) : (
            <FunnelChart stages={funnel} />
          )}
        </SectionCard>
        <PreviewCard
          title="Active pipeline by department"
          subtitle="Candidates currently in each stage"
          bodyClassName="p-4"
        >
          <BarSeriesChart
            data={STAGE_BY_DEPT}
            xKey="dept"
            stacked
            showLegend
            height={250}
            series={[
              { key: 'screen', label: 'Screen', color: BRAND_LIGHT },
              { key: 'phone', label: 'Phone', color: BLUE },
              { key: 'onsite', label: 'Onsite', color: BRAND },
              { key: 'offer', label: 'Offer', color: AMBER },
            ]}
          />
        </PreviewCard>
      </Grid>
      <Grid>
        <SectionCard
          title="Conversion by stage"
          subtitle="Your pipeline stages in order"
          className="xl:col-span-2"
          bodyClassName="p-0"
        >
          <ReportTable
            rows={data.funnel}
            getKey={(r) => r.stage}
            columns={[
              {
                key: 'stage',
                header: 'Stage',
                render: (r) => <span className="font-medium">{r.name}</span>,
              },
              {
                key: 'category',
                header: 'Category',
                render: (r) => STAGE_CATEGORY_LABEL[r.category],
              },
              {
                key: 'reached',
                header: 'Reached',
                align: 'right',
                render: (r) => f.number(r.reached),
              },
              {
                key: 'conversion',
                header: 'To next stage',
                align: 'right',
                render: (r) =>
                  r.conversionToNext == null ? (
                    '-'
                  ) : (
                    <BarWithValue
                      value={r.conversionToNext}
                      color={thresholdColor(r.conversionToNext, 40, 25)}
                    />
                  ),
              },
            ]}
          />
        </SectionCard>
        <SectionCard
          title="Rejection reasons"
          subtitle={`${f.number(rejections)} rejected applications`}
          bodyClassName="p-4"
        >
          {reasons.length === 0 ? (
            <EmptyReport text="No rejections in this period" />
          ) : (
            <RankedBarList items={reasons} />
          )}
        </SectionCard>
      </Grid>
    </div>
  );
}

const REASON_COLORS = [BRAND, BRAND_LIGHT, AMBER, BLUE, RED, GRAY];

const VELOCITY = MONTHS.map((month, i) => ({
  month,
  timeToHire: [34, 33, 33, 32, 31, 30, 30, 29, 28, 27, 27, 26][i],
  timeToFill: [43, 42, 41, 40, 40, 38, 37, 37, 36, 35, 34, 33][i],
  target: 30,
}));

const DEPT_VELOCITY = [
  { dept: 'Engineering', review: 3, screen: 5, onsite: 9, offer: 6 },
  { dept: 'Product', review: 4, screen: 6, onsite: 11, offer: 7 },
  { dept: 'Design', review: 2, screen: 4, onsite: 8, offer: 5 },
  { dept: 'Data', review: 3, screen: 4, onsite: 6, offer: 4 },
  { dept: 'Sales', review: 2, screen: 3, onsite: 4, offer: 3 },
];

export function VelocityReport({ data, previous }: LiveReportProps) {
  const f = useFormatters();
  const timed = data.timeInStage.filter((s) => s.medianDays != null);
  const slowest = [...timed].sort(
    (a, b) => (b.medianDays ?? 0) - (a.medianDays ?? 0),
  )[0];
  const stageDays = timed.map((s) => ({
    label: s.name,
    value: s.medianDays ?? 0,
    color:
      (s.medianDays ?? 0) > 7 ? RED : (s.medianDays ?? 0) > 4 ? AMBER : BRAND,
  }));

  return (
    <div className="space-y-4">
      <KpiGrid>
        <TrendStat
          label="Time to hire"
          value={data.timeToHire.medianDays ?? '-'}
          unit={data.timeToHire.medianDays == null ? undefined : 'days median'}
          delta={changePct(
            data.timeToHire.medianDays,
            previous?.timeToHire.medianDays,
          )}
          invertDelta
          className="p-4"
        />
        <TrendStat
          label="Average time to hire"
          value={data.timeToHire.averageDays ?? '-'}
          unit={data.timeToHire.averageDays == null ? undefined : 'days'}
          delta={changePct(
            data.timeToHire.averageDays,
            previous?.timeToHire.averageDays,
          )}
          invertDelta
          className="p-4"
        />
        <TrendStat
          label="Hires measured"
          value={f.number(data.timeToHire.hires)}
          className="p-4"
        />
        <TrendStat
          label="Slowest stage"
          value={slowest?.name ?? '-'}
          unit={slowest ? `${slowest.medianDays} days median` : undefined}
          className="p-4"
        />
      </KpiGrid>
      <Grid>
        <PreviewCard
          title="Time to hire vs time to fill"
          subtitle="Days, trailing 12 months, 30 day target"
          className="xl:col-span-2"
          bodyClassName="p-4"
        >
          <LineSeriesChart
            data={VELOCITY}
            xKey="month"
            height={250}
            showLegend
            series={[
              { key: 'timeToHire', label: 'Time to hire', color: BRAND },
              { key: 'timeToFill', label: 'Time to fill', color: BLUE },
              { key: 'target', label: 'Target', color: GRAY },
            ]}
          />
        </PreviewCard>
        <SectionCard
          title="Median days in stage"
          subtitle="Bottlenecks in amber and red"
          bodyClassName="p-4"
        >
          {stageDays.length === 0 ? (
            <EmptyReport text="No stage moves in this period" />
          ) : (
            <RankedBarList items={stageDays} formatValue={(v) => `${v} d`} />
          )}
        </SectionCard>
      </Grid>
      <Grid className="xl:grid-cols-2">
        <SectionCard
          title="Time in stage"
          subtitle="Measured from stage entry to exit"
          bodyClassName="p-0"
        >
          <ReportTable
            rows={data.timeInStage}
            getKey={(r) => r.stage}
            columns={[
              {
                key: 'stage',
                header: 'Stage',
                render: (r) => <span className="font-medium">{r.name}</span>,
              },
              {
                key: 'samples',
                header: 'Moves',
                align: 'right',
                render: (r) => f.number(r.samples),
              },
              {
                key: 'median',
                header: 'Median',
                align: 'right',
                render: (r) => (
                  <span className={toneText(r.medianDays ?? 0, 4, 7, false)}>
                    {daysLabel(r.medianDays)}
                  </span>
                ),
              },
              {
                key: 'average',
                header: 'Average',
                align: 'right',
                render: (r) => daysLabel(r.averageDays),
              },
            ]}
          />
        </SectionCard>
        <PreviewCard
          title="Stage duration by department"
          subtitle="Median days, stacked"
          bodyClassName="p-4"
        >
          <BarSeriesChart
            data={DEPT_VELOCITY}
            xKey="dept"
            stacked
            horizontal
            showLegend
            height={240}
            series={[
              { key: 'review', label: 'Review', color: BRAND_LIGHT },
              { key: 'screen', label: 'Screen', color: BLUE },
              { key: 'onsite', label: 'Onsite', color: BRAND },
              { key: 'offer', label: 'Offer', color: AMBER },
            ]}
          />
        </PreviewCard>
      </Grid>
    </div>
  );
}

interface Req {
  id: string;
  role: string;
  dept: string;
  recruiter: string;
  daysOpen: number;
  active: number;
  coverage: number;
  lastActivity: string;
  stage: string;
  health: 'Healthy' | 'Slow' | 'At risk' | 'Stale';
}

const REQS: Req[] = [
  {
    id: 'REQ-1042',
    role: 'Product Manager, Growth',
    dept: 'Product',
    recruiter: 'Kavya Iyer',
    daysOpen: 46,
    active: 7,
    coverage: 0.8,
    lastActivity: '9 days ago',
    stage: 'Onsite',
    health: 'At risk',
  },
  {
    id: 'REQ-1038',
    role: 'Product Designer',
    dept: 'Design',
    recruiter: 'Arjun Nair',
    daysOpen: 34,
    active: 12,
    coverage: 1.6,
    lastActivity: '1 day ago',
    stage: 'Offer',
    health: 'Slow',
  },
  {
    id: 'REQ-1051',
    role: 'Senior Backend Engineer',
    dept: 'Engineering',
    recruiter: 'Kavya Iyer',
    daysOpen: 21,
    active: 18,
    coverage: 2.4,
    lastActivity: 'Today',
    stage: 'Onsite',
    health: 'Healthy',
  },
  {
    id: 'REQ-1047',
    role: 'Marketing Lead',
    dept: 'Marketing',
    recruiter: 'Olivia Brown',
    daysOpen: 58,
    active: 2,
    coverage: 0.3,
    lastActivity: '16 days ago',
    stage: 'Phone screen',
    health: 'Stale',
  },
  {
    id: 'REQ-1055',
    role: 'Data Analyst',
    dept: 'Data',
    recruiter: 'Arjun Nair',
    daysOpen: 12,
    active: 14,
    coverage: 2.1,
    lastActivity: 'Today',
    stage: 'Phone screen',
    health: 'Healthy',
  },
  {
    id: 'REQ-1057',
    role: 'DevOps Engineer',
    dept: 'Engineering',
    recruiter: 'Rahul Menon',
    daysOpen: 9,
    active: 9,
    coverage: 1.9,
    lastActivity: 'Yesterday',
    stage: 'Onsite',
    health: 'Healthy',
  },
  {
    id: 'REQ-1035',
    role: 'QA Engineer',
    dept: 'Engineering',
    recruiter: 'Rahul Menon',
    daysOpen: 39,
    active: 4,
    coverage: 0.9,
    lastActivity: '6 days ago',
    stage: 'Screen',
    health: 'At risk',
  },
  {
    id: 'REQ-1049',
    role: 'Sales Executive',
    dept: 'Sales',
    recruiter: 'Olivia Brown',
    daysOpen: 27,
    active: 11,
    coverage: 1.4,
    lastActivity: '2 days ago',
    stage: 'Onsite',
    health: 'Slow',
  },
  {
    id: 'REQ-1053',
    role: 'HR Business Partner',
    dept: 'People',
    recruiter: 'Kavya Iyer',
    daysOpen: 15,
    active: 6,
    coverage: 1.2,
    lastActivity: 'Yesterday',
    stage: 'Phone screen',
    health: 'Healthy',
  },
];

const HEALTH_TONE: Record<Req['health'], PillTone> = {
  Healthy: 'success',
  Slow: 'warning',
  'At risk': 'danger',
  Stale: 'neutral',
};

const AGING = [
  { bucket: '0-15 days', reqs: 5 },
  { bucket: '16-30 days', reqs: 6 },
  { bucket: '31-45 days', reqs: 4 },
  { bucket: '46-60 days', reqs: 2 },
  { bucket: '60+ days', reqs: 1 },
];

export function JobHealthReport() {
  return (
    <div className="space-y-4">
      <KpiGrid>
        <TrendStat
          label="Open requisitions"
          value="18"
          delta={12.5}
          className="p-4"
        />
        <TrendStat
          label="Avg days open"
          value="29"
          delta={-4.2}
          invertDelta
          className="p-4"
        />
        <TrendStat
          label="Reqs at risk"
          value="3"
          delta={50}
          invertDelta
          className="p-4"
        />
        <TrendStat
          label="Pipeline coverage"
          value="1.5"
          unit="x"
          delta={7.1}
          className="p-4"
        />
      </KpiGrid>
      <Grid>
        <SectionCard
          title="Requisition aging"
          subtitle="Open reqs by days open"
          bodyClassName="p-4"
        >
          <BarSeriesChart
            data={AGING}
            xKey="bucket"
            height={220}
            series={[{ key: 'reqs', label: 'Requisitions', color: BRAND }]}
          />
        </SectionCard>
        <SectionCard
          title="Health distribution"
          subtitle="Based on coverage, activity and age"
          className="xl:col-span-2"
          bodyClassName="p-4"
        >
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              {
                label: 'Healthy',
                value: 9,
                color: BRAND,
                desc: 'Coverage above 1.5x, activity in 3 days',
              },
              {
                label: 'Slow',
                value: 5,
                color: AMBER,
                desc: 'Coverage 1 to 1.5x or stage over SLA',
              },
              {
                label: 'At risk',
                value: 3,
                color: RED,
                desc: 'Coverage below 1x or open 40+ days',
              },
              {
                label: 'Stale',
                value: 1,
                color: GRAY,
                desc: 'No activity in 14 days',
              },
            ].map((h) => (
              <div
                key={h.label}
                className="rounded-md border border-border p-3"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: h.color }}
                  />
                  {h.label}
                </div>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {h.value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{h.desc}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </Grid>
      <SectionCard
        title="Open requisitions"
        subtitle="Sorted by risk"
        bodyClassName="p-0"
      >
        <ReportTable
          rows={[...REQS].sort((a, b) => b.daysOpen - a.daysOpen)}
          getKey={(r) => r.id}
          columns={[
            {
              key: 'id',
              header: 'Req',
              render: (r) => (
                <span className="font-mono text-xs text-muted-foreground">
                  {r.id}
                </span>
              ),
            },
            {
              key: 'role',
              header: 'Role',
              render: (r) => <span className="font-medium">{r.role}</span>,
            },
            { key: 'dept', header: 'Department', render: (r) => r.dept },
            {
              key: 'recruiter',
              header: 'Recruiter',
              render: (r) => (
                <span className="inline-flex items-center gap-2">
                  <InitialsAvatar
                    name={r.recruiter}
                    className="h-5 w-5 text-[9px]"
                  />
                  {r.recruiter}
                </span>
              ),
            },
            {
              key: 'days',
              header: 'Days open',
              align: 'right',
              render: (r) => (
                <span className={toneText(r.daysOpen, 30, 45, false)}>
                  {r.daysOpen}
                </span>
              ),
            },
            {
              key: 'active',
              header: 'Active',
              align: 'right',
              render: (r) => r.active,
            },
            {
              key: 'coverage',
              header: 'Coverage',
              align: 'right',
              render: (r) => (
                <span className={toneText(r.coverage, 1.5, 1)}>
                  {r.coverage.toFixed(1)}x
                </span>
              ),
            },
            { key: 'stage', header: 'Furthest stage', render: (r) => r.stage },
            {
              key: 'last',
              header: 'Last activity',
              render: (r) => (
                <span className="text-muted-foreground">{r.lastActivity}</span>
              ),
            },
            {
              key: 'health',
              header: 'Health',
              render: (r) => (
                <StatusPill tone={HEALTH_TONE[r.health]} dot>
                  {r.health}
                </StatusPill>
              ),
            },
          ]}
        />
      </SectionCard>
    </div>
  );
}
