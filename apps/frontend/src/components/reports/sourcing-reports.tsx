'use client';

import {
  AreaSeriesChart,
  BarSeriesChart,
  DonutChart,
  LegendDots,
  RankedBarList,
  SectionCard,
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
  TEAL,
  VIOLET,
  EmptyReport,
  PreviewCard,
  rateLabel,
  ratio,
  fmt,
  thresholdColor,
  type LiveReportProps,
} from './report-kit';
import { useFormatters } from '@/hooks/use-formatters';
import { SOURCE_LABEL } from '@/components/applications/application-meta';

const SOURCE_COLORS = [
  BRAND,
  BRAND_LIGHT,
  BLUE,
  AMBER,
  VIOLET,
  TEAL,
  RED,
  GRAY,
];

const SOURCE_TREND = MONTHS.map((month, i) => ({
  month,
  linkedin: [148, 152, 160, 171, 166, 178, 182, 190, 198, 204, 211, 219][i],
  referral: [64, 66, 71, 70, 78, 83, 88, 91, 96, 101, 108, 113][i],
  careers: [82, 80, 85, 88, 90, 92, 95, 97, 99, 101, 103, 106][i],
  agency: [41, 44, 46, 48, 51, 50, 52, 55, 57, 58, 60, 62][i],
}));

export function SourceEffectivenessReport({ data }: LiveReportProps) {
  const f = useFormatters();
  const rows = data.sources
    .filter((s) => s.applications > 0 || s.hires > 0)
    .map((s, i) => ({
      ...s,
      label: SOURCE_LABEL[s.source] ?? s.source,
      color: SOURCE_COLORS[i % SOURCE_COLORS.length],
    }));
  const total = rows.reduce((sum, r) => sum + r.applications, 0);
  const totalHires = rows.reduce((sum, r) => sum + r.hires, 0);
  const topHires = [...rows].sort((a, b) => b.hires - a.hires)[0];
  const bestRate = [...rows]
    .filter((r) => r.hireRate != null)
    .sort((a, b) => (b.hireRate ?? 0) - (a.hireRate ?? 0))[0];
  const referral = rows.find((r) => r.source === 'referral');

  return (
    <div className="space-y-4">
      <KpiGrid>
        <TrendStat
          label="Active sources"
          value={f.number(rows.length)}
          className="p-4"
        />
        <TrendStat
          label="Top source of hires"
          value={topHires && topHires.hires > 0 ? topHires.label : '-'}
          unit={
            topHires && topHires.hires > 0
              ? `${f.number(topHires.hires)} hires`
              : undefined
          }
          className="p-4"
        />
        <TrendStat
          label="Best hire rate"
          value={bestRate ? bestRate.label : '-'}
          unit={bestRate ? rateLabel(bestRate.hireRate) : undefined}
          className="p-4"
        />
        <TrendStat
          label="Referral share of hires"
          value={rateLabel(ratio(referral?.hires ?? 0, totalHires))}
          className="p-4"
        />
      </KpiGrid>
      <Grid>
        <SectionCard
          title="Applicant mix"
          subtitle="Share of applications in this period"
          bodyClassName="p-4"
        >
          {total === 0 ? (
            <EmptyReport text="No applications in this period" />
          ) : (
            <div className="flex items-center gap-5">
              <DonutChart
                data={rows.map((s) => ({
                  key: s.source,
                  label: s.label,
                  value: s.applications,
                  color: s.color,
                }))}
                size={150}
                centerValue={f.number(total)}
                centerLabel="Applications"
              />
              <div className="min-w-0 flex-1">
                <LegendDots
                  items={rows.map((s) => ({
                    color: s.color,
                    label: s.label,
                    value: `${Math.round((s.applications / total) * 100)}%`,
                  }))}
                />
              </div>
            </div>
          )}
        </SectionCard>
        <PreviewCard
          title="Applicants by source"
          subtitle="Monthly, trailing 12 months"
          className="xl:col-span-2"
          bodyClassName="p-4"
        >
          <AreaSeriesChart
            data={SOURCE_TREND}
            xKey="month"
            height={220}
            series={[
              { key: 'linkedin', label: 'LinkedIn', color: BRAND },
              { key: 'careers', label: 'Careers page', color: BLUE },
              { key: 'referral', label: 'Referrals', color: BRAND_LIGHT },
              { key: 'agency', label: 'Agencies', color: AMBER },
            ]}
          />
        </PreviewCard>
      </Grid>
      <SectionCard
        title="Source of hire"
        subtitle="Applications and hires by candidate source"
        bodyClassName="p-0"
      >
        {rows.length === 0 ? (
          <EmptyReport text="No applications in this period" />
        ) : (
          <ReportTable
            rows={rows}
            getKey={(r) => r.source}
            columns={[
              {
                key: 'source',
                header: 'Source',
                render: (r) => (
                  <span className="inline-flex items-center gap-2 font-medium">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: r.color }}
                    />
                    {r.label}
                  </span>
                ),
              },
              {
                key: 'applications',
                header: 'Applications',
                align: 'right',
                render: (r) => f.number(r.applications),
              },
              {
                key: 'share',
                header: 'Share',
                align: 'right',
                render: (r) => rateLabel(ratio(r.applications, total)),
              },
              {
                key: 'hires',
                header: 'Hires',
                align: 'right',
                render: (r) => f.number(r.hires),
              },
              {
                key: 'yield',
                header: 'Applications per hire',
                align: 'right',
                render: (r) =>
                  r.hires
                    ? f.number(Math.round(r.applications / r.hires))
                    : '-',
              },
              {
                key: 'rate',
                header: 'Hire rate',
                align: 'right',
                render: (r) =>
                  r.hireRate == null ? (
                    '-'
                  ) : (
                    <BarWithValue
                      value={r.hireRate}
                      max={Math.max(10, r.hireRate)}
                      color={thresholdColor(r.hireRate, 5, 2)}
                    />
                  ),
              },
            ]}
          />
        )}
      </SectionCard>
    </div>
  );
}

const SPEND = [
  { channel: 'Agencies', spend: 33600, hires: 4 },
  { channel: 'LinkedIn Recruiter', spend: 14800, hires: 9 },
  { channel: 'Job boards', spend: 6300, hires: 2 },
  { channel: 'Referral bonuses', spend: 12500, hires: 10 },
  { channel: 'Events', spend: 4200, hires: 1 },
  { channel: 'Careers site', spend: 1800, hires: 3 },
];

const CPH_TREND = MONTHS.map((month, i) => ({
  month,
  cph: [4380, 4310, 4250, 4120, 4060, 3990, 3920, 3870, 3800, 3740, 3660, 3610][
    i
  ],
  benchmark: 4200,
}));

const BUDGET = [
  { quarter: 'Q1', budget: 62, actual: 58 },
  { quarter: 'Q2', budget: 68, actual: 71 },
  { quarter: 'Q3', budget: 70, actual: 66 },
  { quarter: 'Q4', budget: 74, actual: 49 },
];

export function CostReport() {
  const totalSpend = SPEND.reduce((s, r) => s + r.spend, 0);
  return (
    <div className="space-y-4">
      <KpiGrid>
        <TrendStat
          label="Cost per hire"
          value="$3,610"
          delta={-6.0}
          invertDelta
          points={CPH_TREND.map((c) => c.cph)}
          className="p-4"
        />
        <TrendStat
          label="Recruiting spend"
          value={`$${fmt(totalSpend / 1000)}k`}
          unit="this quarter"
          delta={4.3}
          invertDelta
          className="p-4"
        />
        <TrendStat
          label="Agency fees"
          value="46"
          unit="% of spend"
          delta={-8.1}
          invertDelta
          className="p-4"
        />
        <TrendStat
          label="Budget used"
          value="66"
          unit="% of Q4"
          className="p-4"
        />
      </KpiGrid>
      <Grid>
        <SectionCard
          title="Cost per hire trend"
          subtitle="Against industry benchmark of $4,200"
          className="xl:col-span-2"
          bodyClassName="p-4"
        >
          <AreaSeriesChart
            data={CPH_TREND}
            xKey="month"
            height={230}
            yFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
            series={[
              { key: 'cph', label: 'Cost per hire', color: BRAND },
              { key: 'benchmark', label: 'Benchmark', color: GRAY },
            ]}
          />
        </SectionCard>
        <SectionCard
          title="Spend by channel"
          subtitle="This quarter"
          bodyClassName="p-4"
        >
          <RankedBarList
            items={SPEND.map((s, i) => ({
              label: s.channel,
              value: s.spend,
              color: [AMBER, BRAND, VIOLET, BRAND_LIGHT, RED, BLUE][i],
            }))}
            formatValue={(v) => `$${fmt(v)}`}
          />
        </SectionCard>
      </Grid>
      <Grid className="xl:grid-cols-2">
        <SectionCard
          title="Budget vs actual"
          subtitle="Thousands of USD, current fiscal year"
          bodyClassName="p-4"
        >
          <BarSeriesChart
            data={BUDGET}
            xKey="quarter"
            height={220}
            showLegend
            yFormatter={(v) => `$${v}k`}
            series={[
              { key: 'budget', label: 'Budget', color: BRAND_LIGHT },
              { key: 'actual', label: 'Actual', color: BRAND },
            ]}
          />
        </SectionCard>
        <SectionCard
          title="Channel efficiency"
          subtitle="Spend divided by hires"
          bodyClassName="p-0"
        >
          <ReportTable
            rows={SPEND}
            getKey={(r) => r.channel}
            columns={[
              {
                key: 'channel',
                header: 'Channel',
                render: (r) => <span className="font-medium">{r.channel}</span>,
              },
              {
                key: 'spend',
                header: 'Spend',
                align: 'right',
                render: (r) => `$${fmt(r.spend)}`,
              },
              {
                key: 'hires',
                header: 'Hires',
                align: 'right',
                render: (r) => r.hires,
              },
              {
                key: 'cph',
                header: 'Cost per hire',
                align: 'right',
                render: (r) => {
                  const v = r.spend / r.hires;
                  return (
                    <span
                      className={
                        v > 6000 ? 'text-red-600 dark:text-red-400' : ''
                      }
                    >
                      ${fmt(v)}
                    </span>
                  );
                },
              },
            ]}
          />
        </SectionCard>
      </Grid>
    </div>
  );
}
