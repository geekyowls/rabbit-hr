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
  fmt,
  thresholdColor,
} from './report-kit';

interface SourceRow {
  source: string;
  color: string;
  applicants: number;
  screenPass: number;
  onsite: number;
  hires: number;
  quality: number;
  timeToHire: number;
}

const SOURCES: SourceRow[] = [
  {
    source: 'LinkedIn',
    color: BRAND,
    applicants: 412,
    screenPass: 34,
    onsite: 22,
    hires: 4,
    quality: 3.9,
    timeToHire: 29,
  },
  {
    source: 'Employee referrals',
    color: BRAND_LIGHT,
    applicants: 238,
    screenPass: 52,
    onsite: 24,
    hires: 5,
    quality: 4.4,
    timeToHire: 21,
  },
  {
    source: 'Careers page',
    color: BLUE,
    applicants: 206,
    screenPass: 28,
    onsite: 11,
    hires: 1,
    quality: 3.6,
    timeToHire: 31,
  },
  {
    source: 'Agencies',
    color: AMBER,
    applicants: 130,
    screenPass: 41,
    onsite: 12,
    hires: 1,
    quality: 3.8,
    timeToHire: 24,
  },
  {
    source: 'Job boards',
    color: VIOLET,
    applicants: 98,
    screenPass: 17,
    onsite: 3,
    hires: 0,
    quality: 3.1,
    timeToHire: 0,
  },
  {
    source: 'Talent rediscovery',
    color: TEAL,
    applicants: 37,
    screenPass: 46,
    onsite: 2,
    hires: 0,
    quality: 4.1,
    timeToHire: 0,
  },
];

const SOURCE_TREND = MONTHS.map((month, i) => ({
  month,
  linkedin: [148, 152, 160, 171, 166, 178, 182, 190, 198, 204, 211, 219][i],
  referral: [64, 66, 71, 70, 78, 83, 88, 91, 96, 101, 108, 113][i],
  careers: [82, 80, 85, 88, 90, 92, 95, 97, 99, 101, 103, 106][i],
  agency: [41, 44, 46, 48, 51, 50, 52, 55, 57, 58, 60, 62][i],
}));

export function SourceEffectivenessReport() {
  const total = SOURCES.reduce((s, r) => s + r.applicants, 0);
  return (
    <div className="space-y-4">
      <KpiGrid>
        <TrendStat label="Active sources" value="6" className="p-4" />
        <TrendStat
          label="Referral share of hires"
          value="45"
          unit="%"
          delta={9.0}
          className="p-4"
        />
        <TrendStat label="Best pass rate" value="Referrals" className="p-4" />
        <TrendStat
          label="Inbound vs outbound"
          value="68 / 32"
          delta={-3.4}
          className="p-4"
        />
      </KpiGrid>
      <Grid>
        <SectionCard
          title="Applicant mix"
          subtitle="Share of applicants, last 90 days"
          bodyClassName="p-4"
        >
          <div className="flex items-center gap-5">
            <DonutChart
              data={SOURCES.map((s) => ({
                key: s.source,
                label: s.source,
                value: s.applicants,
                color: s.color,
              }))}
              size={150}
              centerValue={fmt(total)}
              centerLabel="Applicants"
            />
            <div className="min-w-0 flex-1">
              <LegendDots
                items={SOURCES.map((s) => ({
                  color: s.color,
                  label: s.source,
                  value: `${Math.round((s.applicants / total) * 100)}%`,
                }))}
              />
            </div>
          </div>
        </SectionCard>
        <SectionCard
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
        </SectionCard>
      </Grid>
      <SectionCard
        title="Source quality"
        subtitle="Quality is the average onsite scorecard rating out of 5"
        bodyClassName="p-0"
      >
        <ReportTable
          rows={SOURCES}
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
                  {r.source}
                </span>
              ),
            },
            {
              key: 'applicants',
              header: 'Applicants',
              align: 'right',
              render: (r) => r.applicants,
            },
            {
              key: 'pass',
              header: 'Screen pass',
              align: 'right',
              render: (r) => (
                <BarWithValue
                  value={r.screenPass}
                  color={thresholdColor(r.screenPass, 40, 28)}
                />
              ),
            },
            {
              key: 'onsite',
              header: 'Reached onsite',
              align: 'right',
              render: (r) => r.onsite,
            },
            {
              key: 'hires',
              header: 'Hires',
              align: 'right',
              render: (r) => r.hires,
            },
            {
              key: 'yield',
              header: 'Applicants per hire',
              align: 'right',
              render: (r) =>
                r.hires ? Math.round(r.applicants / r.hires) : '-',
            },
            {
              key: 'quality',
              header: 'Quality',
              align: 'right',
              render: (r) => (
                <BarWithValue
                  value={r.quality}
                  max={5}
                  suffix=""
                  color={thresholdColor(r.quality, 4, 3.5)}
                />
              ),
            },
            {
              key: 'tth',
              header: 'Time to hire',
              align: 'right',
              render: (r) => (r.timeToHire ? `${r.timeToHire} d` : '-'),
            },
          ]}
        />
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
