'use client';

import {
  BarSeriesChart,
  DonutChart,
  LegendDots,
  LineSeriesChart,
  MetricRing,
  RankedBarList,
  SectionCard,
  StatusPill,
  TrendStat,
} from '@/components/patterns';
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
  RED,
  ReportTable,
  SplitBar,
  VIOLET,
  EmptyReport,
  PreviewCard,
  changePct,
  pointsChange,
  rateLabel,
  thresholdColor,
  toneText,
  type LiveReportProps,
} from './report-kit';
import Link from 'next/link';
import { useFormatters } from '@/hooks/use-formatters';
import { useOffersQuery } from '@/hooks/queries';
import {
  OFFER_STATUS_LABEL,
  OFFER_STATUS_TONE,
  candidateName,
  offerSalary,
} from '@/components/offers/offer-meta';

const ACCEPT_TREND = MONTHS.map((month, i) => ({
  month,
  accept: [78, 80, 79, 82, 81, 83, 84, 82, 85, 84, 86, 86][i],
  target: 85,
}));

const DECLINES = [
  { key: 'comp', label: 'Compensation', value: 7, color: RED },
  { key: 'counter', label: 'Counter offer', value: 4, color: AMBER },
  { key: 'other', label: 'Accepted elsewhere', value: 3, color: VIOLET },
  { key: 'loc', label: 'Location or remote', value: 2, color: BLUE },
  { key: 'role', label: 'Role scope', value: 1, color: GRAY },
];

export function OffersReport({ data, previous, filters }: LiveReportProps) {
  const f = useFormatters();
  const o = data.offers;
  const { data: recent, isLoading } = useOffersQuery({
    page: 1,
    limit: 8,
    ...(filters.jobId ? { jobId: filters.jobId } : {}),
    ...(filters.clientId ? { clientId: filters.clientId } : {}),
  });
  const outcomes = [
    { key: 'accepted', label: 'Accepted', value: o.accepted, color: BRAND },
    { key: 'declined', label: 'Declined', value: o.declined, color: RED },
    {
      key: 'open',
      label: 'Awaiting response',
      value: Math.max(0, o.sent - o.accepted - o.declined),
      color: BLUE,
    },
  ];
  const decided = o.accepted + o.declined;

  return (
    <div className="space-y-4">
      <KpiGrid>
        <TrendStat
          label="Offers sent"
          value={f.number(o.sent)}
          delta={changePct(o.sent, previous?.offers.sent)}
          className="p-4"
        />
        <TrendStat
          label="Acceptance rate"
          value={rateLabel(o.acceptanceRate)}
          delta={pointsChange(
            o.acceptanceRate,
            previous?.offers.acceptanceRate,
          )}
          className="p-4"
        />
        <TrendStat
          label="Accepted"
          value={f.number(o.accepted)}
          unit={`of ${f.number(decided)} decided`}
          className="p-4"
        />
        <TrendStat
          label="Declined"
          value={f.number(o.declined)}
          delta={changePct(o.declined, previous?.offers.declined)}
          invertDelta
          className="p-4"
        />
      </KpiGrid>
      <Grid>
        <PreviewCard
          title="Offer acceptance trend"
          subtitle="Percent, against 85% target"
          className="xl:col-span-2"
          bodyClassName="p-4"
        >
          <LineSeriesChart
            data={ACCEPT_TREND}
            xKey="month"
            height={230}
            showLegend
            yFormatter={(v) => `${v}%`}
            series={[
              { key: 'accept', label: 'Acceptance', color: BRAND },
              { key: 'target', label: 'Target', color: GRAY },
            ]}
          />
        </PreviewCard>
        <SectionCard
          title="Offer outcomes"
          subtitle={`${f.number(o.created)} drafted, ${f.number(o.pendingApproval)} awaiting approval`}
          bodyClassName="p-4"
        >
          {o.sent === 0 ? (
            <EmptyReport text="No offers sent in this period" />
          ) : (
            <div className="flex items-center gap-4">
              <DonutChart
                data={outcomes}
                size={130}
                centerValue={f.number(o.sent)}
                centerLabel="Sent"
              />
              <div className="min-w-0 flex-1">
                <LegendDots
                  items={outcomes.map((d) => ({
                    color: d.color,
                    label: d.label,
                    value: f.number(d.value),
                  }))}
                />
              </div>
            </div>
          )}
        </SectionCard>
      </Grid>
      <Grid className="xl:grid-cols-2">
        <PreviewCard
          title="Decline reasons"
          subtitle="Grouped reasons from declined offers"
          bodyClassName="p-4"
        >
          <div className="flex items-center gap-4">
            <DonutChart
              data={DECLINES}
              size={130}
              centerValue="17"
              centerLabel="Declines"
            />
            <div className="min-w-0 flex-1">
              <LegendDots
                items={DECLINES.map((d) => ({
                  color: d.color,
                  label: d.label,
                  value: String(d.value),
                }))}
              />
            </div>
          </div>
        </PreviewCard>
        <SectionCard
          title="Recent offers"
          subtitle="Latest updated, not limited to the period"
          bodyClassName="p-0"
          actions={
            <Link
              href="/dashboard/offers"
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              All offers
            </Link>
          }
        >
          {isLoading ? (
            <EmptyReport text="Loading offers" />
          ) : (recent?.data ?? []).length === 0 ? (
            <EmptyReport text="No offers yet" />
          ) : (
            <ReportTable
              rows={recent?.data ?? []}
              getKey={(r) => r.id}
              columns={[
                {
                  key: 'candidate',
                  header: 'Candidate',
                  render: (r) => (
                    <Link
                      href={`/dashboard/offers?id=${r.id}`}
                      className="font-medium hover:underline"
                    >
                      {candidateName(r)}
                    </Link>
                  ),
                },
                { key: 'job', header: 'Job', render: (r) => r.job.title },
                {
                  key: 'salary',
                  header: 'Salary',
                  align: 'right',
                  render: (r) => offerSalary(r, f),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (r) => (
                    <StatusPill tone={OFFER_STATUS_TONE[r.status]} dot>
                      {OFFER_STATUS_LABEL[r.status]}
                    </StatusPill>
                  ),
                },
              ]}
            />
          )}
        </SectionCard>
      </Grid>
    </div>
  );
}

const QUALITY_BY_SOURCE = [
  {
    source: 'Employee referrals',
    retention: 97,
    satisfaction: 4.6,
    ramp: 38,
    perf: 4.3,
  },
  { source: 'LinkedIn', retention: 92, satisfaction: 4.2, ramp: 46, perf: 3.9 },
  { source: 'Agencies', retention: 84, satisfaction: 3.9, ramp: 52, perf: 3.7 },
  {
    source: 'Careers page',
    retention: 90,
    satisfaction: 4.1,
    ramp: 44,
    perf: 3.8,
  },
  {
    source: 'Talent rediscovery',
    retention: 100,
    satisfaction: 4.5,
    ramp: 35,
    perf: 4.2,
  },
];

const RETENTION_COHORTS = [
  { cohort: 'Q4 25', d30: 100, d90: 96, d180: 91 },
  { cohort: 'Q1 26', d30: 98, d90: 94, d180: 89 },
  { cohort: 'Q2 26', d30: 100, d90: 95, d180: 0 },
  { cohort: 'Q3 26', d30: 97, d90: 0, d180: 0 },
];

export function QualityReport() {
  return (
    <div className="space-y-4">
      <KpiGrid>
        <TrendStat
          label="90 day retention"
          value="94"
          unit="%"
          delta={1.6}
          className="p-4"
        />
        <TrendStat
          label="Hiring manager satisfaction"
          value="4.3"
          unit="/ 5"
          delta={4.9}
          className="p-4"
        />
        <TrendStat
          label="Time to productivity"
          value="44"
          unit="days"
          delta={-8.3}
          invertDelta
          className="p-4"
        />
        <TrendStat
          label="Early attrition"
          value="3"
          unit="hires"
          delta={-25}
          invertDelta
          className="p-4"
        />
      </KpiGrid>
      <Grid>
        <SectionCard
          title="Quality of hire score"
          subtitle="Weighted: retention, performance, manager rating"
          bodyClassName="flex flex-col items-center justify-center gap-3 p-4"
        >
          <MetricRing value={82} size={150} label="Score" />
          <p className="text-center text-xs text-muted-foreground">
            Up from 77 last year, top quartile for Series B SaaS
          </p>
        </SectionCard>
        <SectionCard
          title="Retention by hiring cohort"
          subtitle="Percent still employed"
          className="xl:col-span-2"
          bodyClassName="p-0"
        >
          <ReportTable
            rows={RETENTION_COHORTS}
            getKey={(r) => r.cohort}
            columns={[
              {
                key: 'cohort',
                header: 'Cohort',
                render: (r) => <span className="font-medium">{r.cohort}</span>,
              },
              {
                key: 'd30',
                header: '30 days',
                align: 'right',
                render: (r) => (
                  <BarWithValue
                    value={r.d30}
                    color={thresholdColor(r.d30, 95, 90)}
                  />
                ),
              },
              {
                key: 'd90',
                header: '90 days',
                align: 'right',
                render: (r) =>
                  r.d90 ? (
                    <BarWithValue
                      value={r.d90}
                      color={thresholdColor(r.d90, 93, 88)}
                    />
                  ) : (
                    <span className="text-muted-foreground">Pending</span>
                  ),
              },
              {
                key: 'd180',
                header: '180 days',
                align: 'right',
                render: (r) =>
                  r.d180 ? (
                    <BarWithValue
                      value={r.d180}
                      color={thresholdColor(r.d180, 90, 85)}
                    />
                  ) : (
                    <span className="text-muted-foreground">Pending</span>
                  ),
              },
            ]}
          />
        </SectionCard>
      </Grid>
      <SectionCard
        title="Quality by source"
        subtitle="Hires from the last 12 months"
        bodyClassName="p-0"
      >
        <ReportTable
          rows={QUALITY_BY_SOURCE}
          getKey={(r) => r.source}
          columns={[
            {
              key: 'source',
              header: 'Source',
              render: (r) => <span className="font-medium">{r.source}</span>,
            },
            {
              key: 'ret',
              header: '90 day retention',
              align: 'right',
              render: (r) => (
                <BarWithValue
                  value={r.retention}
                  color={thresholdColor(r.retention, 93, 88)}
                />
              ),
            },
            {
              key: 'sat',
              header: 'Manager rating',
              align: 'right',
              render: (r) => (
                <BarWithValue
                  value={r.satisfaction}
                  max={5}
                  suffix=""
                  color={thresholdColor(r.satisfaction, 4.2, 4)}
                />
              ),
            },
            {
              key: 'perf',
              header: 'First review',
              align: 'right',
              render: (r) => (
                <BarWithValue
                  value={r.perf}
                  max={5}
                  suffix=""
                  color={thresholdColor(r.perf, 4, 3.8)}
                />
              ),
            },
            {
              key: 'ramp',
              header: 'Ramp time',
              align: 'right',
              render: (r) => (
                <span className={toneText(r.ramp, 42, 50, false)}>
                  {r.ramp} d
                </span>
              ),
            },
          ]}
        />
      </SectionCard>
    </div>
  );
}

const PLAN = [
  { team: 'Engineering', target: 12, hired: 8, offer: 2, pipeline: 41 },
  { team: 'Product', target: 3, hired: 2, offer: 0, pipeline: 11 },
  { team: 'Design', target: 2, hired: 1, offer: 1, pipeline: 9 },
  { team: 'Data', target: 3, hired: 1, offer: 0, pipeline: 14 },
  { team: 'Sales', target: 6, hired: 5, offer: 0, pipeline: 12 },
  { team: 'People', target: 1, hired: 1, offer: 0, pipeline: 0 },
];

const QUARTERLY = [
  { quarter: 'Q1', target: 18, hired: 17 },
  { quarter: 'Q2', target: 22, hired: 23 },
  { quarter: 'Q3', target: 24, hired: 21 },
  { quarter: 'Q4', target: 27, hired: 18 },
];

export function HiringPlanReport() {
  const target = PLAN.reduce((s, p) => s + p.target, 0);
  const hired = PLAN.reduce((s, p) => s + p.hired, 0);
  const offer = PLAN.reduce((s, p) => s + p.offer, 0);
  return (
    <div className="space-y-4">
      <KpiGrid>
        <TrendStat
          label="Q4 target"
          value={target}
          unit="hires"
          className="p-4"
        />
        <TrendStat label="Hired" value={hired} delta={8.3} className="p-4" />
        <TrendStat label="In offer" value={offer} className="p-4" />
        <TrendStat
          label="Forecast attainment"
          value="81"
          unit="%"
          delta={-4.0}
          className="p-4"
        />
      </KpiGrid>
      <Grid>
        <SectionCard
          title="Progress by team"
          subtitle="Hired, in offer and remaining"
          className="xl:col-span-2"
          bodyClassName="space-y-3 p-4"
        >
          {PLAN.map((p) => (
            <div key={p.team} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{p.team}</span>
                <span className="tabular-nums text-muted-foreground">
                  {p.hired + p.offer} / {p.target}
                </span>
              </div>
              <SplitBar
                parts={[
                  { label: 'Hired', value: p.hired, color: BRAND },
                  { label: 'In offer', value: p.offer, color: BRAND_LIGHT },
                  {
                    label: 'Remaining',
                    value: Math.max(p.target - p.hired - p.offer, 0),
                    color: 'transparent',
                  },
                ]}
              />
            </div>
          ))}
          <div className="flex gap-4 pt-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: BRAND }}
              />
              Hired
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: BRAND_LIGHT }}
              />
              In offer
            </span>
          </div>
        </SectionCard>
        <SectionCard
          title="Target vs hired"
          subtitle="By quarter, this fiscal year"
          bodyClassName="p-4"
        >
          <BarSeriesChart
            data={QUARTERLY}
            xKey="quarter"
            height={220}
            showLegend
            series={[
              { key: 'target', label: 'Target', color: BRAND_LIGHT },
              { key: 'hired', label: 'Hired', color: BRAND },
            ]}
          />
        </SectionCard>
      </Grid>
      <Grid className="xl:grid-cols-2">
        <SectionCard title="Plan detail" bodyClassName="p-0">
          <ReportTable
            rows={PLAN}
            getKey={(r) => r.team}
            columns={[
              {
                key: 'team',
                header: 'Team',
                render: (r) => <span className="font-medium">{r.team}</span>,
              },
              {
                key: 'target',
                header: 'Target',
                align: 'right',
                render: (r) => r.target,
              },
              {
                key: 'hired',
                header: 'Hired',
                align: 'right',
                render: (r) => r.hired,
              },
              {
                key: 'gap',
                header: 'Gap',
                align: 'right',
                render: (r) => r.target - r.hired - r.offer,
              },
              {
                key: 'pipe',
                header: 'Pipeline',
                align: 'right',
                render: (r) => r.pipeline,
              },
              {
                key: 'status',
                header: 'Outlook',
                render: (r) => {
                  const gap = r.target - r.hired - r.offer;
                  if (gap <= 0)
                    return <StatusPill tone="success">Met</StatusPill>;
                  if (r.pipeline / gap >= 5)
                    return <StatusPill tone="info">On track</StatusPill>;
                  return <StatusPill tone="warning">Behind</StatusPill>;
                },
              },
            ]}
          />
        </SectionCard>
        <SectionCard
          title="Gap by team"
          subtitle="Hires still needed this quarter"
          bodyClassName="p-4"
        >
          <RankedBarList
            items={PLAN.filter((p) => p.target - p.hired - p.offer > 0).map(
              (p) => ({
                label: p.team,
                value: p.target - p.hired - p.offer,
                color: AMBER,
              }),
            )}
            formatValue={(v) => `${v} hires`}
          />
        </SectionCard>
      </Grid>
    </div>
  );
}
