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
import { useFormatters } from '@/hooks/use-formatters';
import {
  AMBER,
  BRAND,
  BRAND_LIGHT,
  EmptyReport,
  Grid,
  KpiGrid,
  PreviewCard,
  changePct,
  flowFunnel,
  pointsChange,
  rateLabel,
  type LiveReportProps,
} from './report-kit';

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

export function ExecutiveSummary({ data, previous }: LiveReportProps) {
  const f = useFormatters();
  const weekly = data.applicationsOverTime.map((w) => ({
    week: f.dateLong(w.weekStart, { day: 'numeric', month: 'short' }),
    applications: w.applications,
    hires: w.hires,
  }));
  const funnel = flowFunnel(data);

  return (
    <div className="space-y-4">
      <KpiGrid cols={5}>
        <TrendStat
          label="Applications"
          value={f.number(data.totals.applications)}
          delta={changePct(
            data.totals.applications,
            previous?.totals.applications,
          )}
          className="p-4"
        />
        <TrendStat
          label="Hires"
          value={f.number(data.totals.hires)}
          delta={changePct(data.totals.hires, previous?.totals.hires)}
          className="p-4"
        />
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
          label="Offer acceptance"
          value={rateLabel(data.offers.acceptanceRate)}
          delta={pointsChange(
            data.offers.acceptanceRate,
            previous?.offers.acceptanceRate,
          )}
          className="p-4"
        />
        <TrendStat
          label="Interviews"
          value={f.number(data.totals.interviews)}
          delta={changePct(data.totals.interviews, previous?.totals.interviews)}
          className="p-4"
        />
      </KpiGrid>

      <Grid>
        <SectionCard
          title="Applications and hires"
          subtitle="Per week in the selected period"
          className="xl:col-span-2"
          bodyClassName="p-4"
        >
          {weekly.length === 0 ? (
            <EmptyReport text="No applications in this period" />
          ) : (
            <BarSeriesChart
              data={weekly}
              xKey="week"
              height={240}
              showLegend
              series={[
                {
                  key: 'applications',
                  label: 'Applications',
                  color: BRAND_LIGHT,
                },
                { key: 'hires', label: 'Hires', color: BRAND },
              ]}
            />
          )}
        </SectionCard>
        <PreviewCard
          title="Hiring plan"
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
        </PreviewCard>
      </Grid>

      <Grid>
        <SectionCard
          title="Funnel snapshot"
          subtitle="Applications that reached each stage"
          className="xl:col-span-2"
          bodyClassName="p-4"
        >
          {funnel.length === 0 ? (
            <EmptyReport text="No pipeline stages configured" />
          ) : (
            <FunnelChart stages={funnel} />
          )}
        </SectionCard>
        <PreviewCard
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
        </PreviewCard>
      </Grid>
    </div>
  );
}
