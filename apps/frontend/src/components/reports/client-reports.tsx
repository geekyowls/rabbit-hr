'use client';

import { BarSeriesChart, SectionCard, TrendStat } from '@/components/patterns';
import { useFormatters } from '@/hooks/use-formatters';
import {
  BRAND,
  BRAND_LIGHT,
  BarWithValue,
  EmptyReport,
  Grid,
  KpiGrid,
  ReportTable,
  rateLabel,
  ratio,
  thresholdColor,
  type LiveReportProps,
} from './report-kit';

export function ClientReport({ data }: LiveReportProps) {
  const f = useFormatters();
  const rows = data.clients;
  const withClient = rows.filter((r) => r.clientId);
  const topHires = [...withClient].sort((a, b) => b.hires - a.hires)[0];
  const topApps = [...withClient].sort(
    (a, b) => b.applications - a.applications,
  )[0];
  const clientApps = withClient.reduce((s, r) => s + r.applications, 0);

  return (
    <div className="space-y-4">
      <KpiGrid>
        <TrendStat
          label="Clients with activity"
          value={f.number(withClient.length)}
          className="p-4"
        />
        <TrendStat
          label="Most applications"
          value={topApps?.name ?? '-'}
          unit={
            topApps
              ? `${f.number(topApps.applications)} applications`
              : undefined
          }
          className="p-4"
        />
        <TrendStat
          label="Most hires"
          value={topHires && topHires.hires > 0 ? topHires.name : '-'}
          unit={
            topHires && topHires.hires > 0
              ? `${f.number(topHires.hires)} hires`
              : undefined
          }
          className="p-4"
        />
        <TrendStat
          label="Client share of applications"
          value={rateLabel(ratio(clientApps, data.totals.applications))}
          className="p-4"
        />
      </KpiGrid>
      <Grid className="xl:grid-cols-2">
        <SectionCard
          title="Applications and hires by client"
          subtitle="Jobs without a client are grouped together"
          bodyClassName="p-4"
        >
          {rows.length === 0 ? (
            <EmptyReport text="No applications in this period" />
          ) : (
            <BarSeriesChart
              data={rows.slice(0, 12)}
              xKey="name"
              horizontal
              showLegend
              height={Math.max(180, Math.min(rows.length, 12) * 34)}
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
        <SectionCard title="By client" bodyClassName="p-0">
          {rows.length === 0 ? (
            <EmptyReport text="No applications in this period" />
          ) : (
            <ReportTable
              rows={rows}
              getKey={(r) => r.clientId ?? 'none'}
              columns={[
                {
                  key: 'name',
                  header: 'Client',
                  render: (r) => <span className="font-medium">{r.name}</span>,
                },
                {
                  key: 'applications',
                  header: 'Applications',
                  align: 'right',
                  render: (r) => f.number(r.applications),
                },
                {
                  key: 'hires',
                  header: 'Hires',
                  align: 'right',
                  render: (r) => f.number(r.hires),
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
      </Grid>
    </div>
  );
}
