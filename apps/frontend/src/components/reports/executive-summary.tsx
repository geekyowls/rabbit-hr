'use client';

import { AlertTriangle, Clock, TrendingDown, UserX } from 'lucide-react';
import {
  BarSeriesChart,
  FunnelChart,
  MetricRing,
  SectionCard,
  StatusPill,
  TrendStat,
  type PillTone,
} from '@/components/patterns';
import {
  AMBER,
  BRAND,
  BRAND_LIGHT,
  Grid,
  KpiGrid,
  MONTHS,
  RANGE_FACTOR,
  fmt,
  type ReportProps,
} from './report-kit';

const DELTAS = {
  '30d': [18.2, 22.2, -3.7, 4.1, -6.0],
  '90d': [24.8, 11.5, -8.2, 2.6, -9.4],
  '12m': [31.4, 26.9, -14.1, 5.8, -12.2],
};

const HIRES_VS_PLAN = MONTHS.map((month, i) => ({
  month,
  hired: [6, 4, 7, 9, 8, 10, 9, 12, 11, 13, 10, 11][i],
  plan: [7, 6, 8, 9, 9, 10, 10, 11, 11, 12, 12, 12][i],
}));

const RISKS: {
  icon: typeof AlertTriangle;
  title: string;
  detail: string;
  tone: PillTone;
  tag: string;
}[] = [
  {
    icon: Clock,
    title: 'Product Manager, Growth open 46 days',
    detail: 'Coverage 0.8x, no onsite in 2 weeks',
    tone: 'danger',
    tag: 'At risk',
  },
  {
    icon: TrendingDown,
    title: 'Onsite to offer down 6 points',
    detail: 'Engineering only, driven by system design round',
    tone: 'warning',
    tag: 'Watch',
  },
  {
    icon: UserX,
    title: '3 offer declines on compensation',
    detail: 'All Bengaluru, below P50 of band',
    tone: 'warning',
    tag: 'Watch',
  },
  {
    icon: AlertTriangle,
    title: 'Scorecard SLA missed 14 times',
    detail: '3 interviewers account for 71%',
    tone: 'info',
    tag: 'Process',
  },
];

export function ExecutiveSummary({ range }: ReportProps) {
  const f = RANGE_FACTOR[range];
  const d = DELTAS[range];
  const applicants = 1084 * f;
  const hires = Math.round(11 * f);
  const funnel = [
    { label: 'Applied', value: Math.round(applicants) },
    { label: 'Screened', value: Math.round(412 * f) },
    { label: 'Phone screen', value: Math.round(186 * f) },
    { label: 'Onsite', value: Math.round(74 * f) },
    { label: 'Offer', value: Math.round(15 * f) },
    { label: 'Hired', value: hires },
  ];

  return (
    <div className="space-y-4">
      <KpiGrid cols={5} rangeAware>
        <TrendStat
          label="Applicants"
          value={fmt(applicants)}
          delta={d[0]}
          className="p-4"
        />
        <TrendStat label="Hires" value={hires} delta={d[1]} className="p-4" />
        <TrendStat
          label="Time to hire"
          value={range === '30d' ? 26 : range === '90d' ? 28 : 31}
          unit="days"
          delta={d[2]}
          invertDelta
          className="p-4"
        />
        <TrendStat
          label="Offer acceptance"
          value={range === '12m' ? 84 : 86}
          unit="%"
          delta={d[3]}
          className="p-4"
        />
        <TrendStat
          label="Cost per hire"
          value={range === '12m' ? '$3,940' : '$3,610'}
          delta={d[4]}
          invertDelta
          className="p-4"
        />
      </KpiGrid>

      <Grid>
        <SectionCard
          title="Hires vs plan"
          subtitle="Monthly, trailing 12 months"
          className="xl:col-span-2"
          bodyClassName="p-4"
        >
          <BarSeriesChart
            data={HIRES_VS_PLAN}
            xKey="month"
            height={240}
            showLegend
            series={[
              { key: 'hired', label: 'Hired', color: BRAND },
              { key: 'plan', label: 'Plan', color: BRAND_LIGHT },
            ]}
          />
        </SectionCard>
        <SectionCard
          title="Q4 hiring plan"
          subtitle="Company wide"
          bodyClassName="flex flex-col items-center justify-center gap-4 p-4"
        >
          <MetricRing
            value={18}
            max={27}
            size={150}
            valueLabel="18 / 27"
            label="Hired"
          />
          <div className="grid w-full grid-cols-3 gap-2 text-center text-xs">
            <div>
              <p className="text-base font-semibold tabular-nums">4</p>
              <p className="text-muted-foreground">In offer</p>
            </div>
            <div>
              <p className="text-base font-semibold tabular-nums">5</p>
              <p className="text-muted-foreground">Gap</p>
            </div>
            <div>
              <p
                className="text-base font-semibold tabular-nums"
                style={{ color: AMBER }}
              >
                81%
              </p>
              <p className="text-muted-foreground">Forecast</p>
            </div>
          </div>
        </SectionCard>
      </Grid>

      <Grid>
        <SectionCard
          title="Funnel snapshot"
          subtitle="Conversion from previous stage"
          className="xl:col-span-2"
          bodyClassName="p-4"
        >
          <FunnelChart stages={funnel} />
        </SectionCard>
        <SectionCard
          title="Top risks"
          subtitle="Flagged from pipeline signals"
          bodyClassName="p-0"
        >
          <ul className="divide-y divide-border">
            {RISKS.map((r) => (
              <li key={r.title} className="flex items-start gap-3 px-4 py-3">
                <r.icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{r.title}</p>
                  <p className="text-xs text-muted-foreground">{r.detail}</p>
                </div>
                <StatusPill tone={r.tone}>{r.tag}</StatusPill>
              </li>
            ))}
          </ul>
        </SectionCard>
      </Grid>
    </div>
  );
}
