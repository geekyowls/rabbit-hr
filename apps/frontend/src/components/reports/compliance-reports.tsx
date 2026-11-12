'use client';

import { ShieldCheck } from 'lucide-react';
import {
  BarSeriesChart,
  HeatmapGrid,
  LineSeriesChart,
  SectionCard,
  StatusPill,
  TrendStat,
} from '@/components/patterns';
import {
  BRAND,
  BRAND_LIGHT,
  BarWithValue,
  GRAY,
  Grid,
  KpiGrid,
  MONTHS,
  ReportTable,
  VIOLET,
  thresholdColor,
  toneText,
} from './report-kit';

const GENDER_BY_STAGE = [
  { stage: 'Applied', women: 38, men: 58, undisclosed: 4 },
  { stage: 'Screened', women: 39, men: 57, undisclosed: 4 },
  { stage: 'Phone', women: 37, men: 59, undisclosed: 4 },
  { stage: 'Onsite', women: 35, men: 62, undisclosed: 3 },
  { stage: 'Offer', women: 40, men: 60, undisclosed: 0 },
  { stage: 'Hired', women: 45, men: 55, undisclosed: 0 },
];

const PARITY = [
  { group: 'Women', screen: 39, onsite: 36, offer: 22, ratio: 0.94 },
  { group: 'Men', screen: 38, onsite: 41, offer: 20, ratio: 1.0 },
  { group: 'Non-binary', screen: 40, onsite: 38, offer: 25, ratio: 0.97 },
  { group: 'Undisclosed', screen: 35, onsite: 30, offer: 0, ratio: 0.82 },
];

export function DiversityReport() {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm">
        <ShieldCheck
          className="mt-0.5 h-4 w-4 shrink-0"
          style={{ color: BRAND }}
        />
        <p className="text-muted-foreground">
          Self-identified, voluntary data shown in aggregate only. Groups
          smaller than 5 candidates are suppressed and data is never visible on
          individual profiles
        </p>
      </div>
      <KpiGrid>
        <TrendStat
          label="Response rate"
          value="71"
          unit="%"
          delta={6.0}
          className="p-4"
        />
        <TrendStat
          label="Women in hires"
          value="45"
          unit="%"
          delta={7.1}
          className="p-4"
        />
        <TrendStat
          label="Lowest adverse impact ratio"
          value="0.82"
          className="p-4"
        />
        <TrendStat
          label="Diverse panels"
          value="78"
          unit="% of onsites"
          delta={11.4}
          className="p-4"
        />
      </KpiGrid>
      <Grid className="xl:grid-cols-2">
        <SectionCard
          title="Representation by stage"
          subtitle="Gender, percent of candidates"
          bodyClassName="p-4"
        >
          <BarSeriesChart
            data={GENDER_BY_STAGE}
            xKey="stage"
            stacked
            showLegend
            height={250}
            yFormatter={(v) => `${v}%`}
            series={[
              { key: 'women', label: 'Women', color: BRAND },
              { key: 'men', label: 'Men', color: BRAND_LIGHT },
              { key: 'undisclosed', label: 'Undisclosed', color: GRAY },
            ]}
          />
        </SectionCard>
        <SectionCard
          title="Representation by department"
          subtitle="Percent of women at onsite stage"
          bodyClassName="p-4"
        >
          <HeatmapGrid
            columns={['Q1', 'Q2', 'Q3', 'Q4']}
            max={60}
            rows={[
              { label: 'Engineering', values: [24, 27, 29, 31] },
              { label: 'Product', values: [41, 44, 46, 48] },
              { label: 'Design', values: [52, 55, 53, 57] },
              { label: 'Data', values: [33, 35, 38, 36] },
              { label: 'Sales', values: [39, 42, 41, 44] },
            ]}
          />
        </SectionCard>
      </Grid>
      <SectionCard
        title="Pass-through parity"
        subtitle="Adverse impact ratio uses the four-fifths rule, values under 0.8 are flagged"
        bodyClassName="p-0"
      >
        <ReportTable
          rows={PARITY}
          getKey={(r) => r.group}
          columns={[
            {
              key: 'group',
              header: 'Group',
              render: (r) => <span className="font-medium">{r.group}</span>,
            },
            {
              key: 'screen',
              header: 'Screen pass',
              align: 'right',
              render: (r) => <BarWithValue value={r.screen} />,
            },
            {
              key: 'onsite',
              header: 'Onsite pass',
              align: 'right',
              render: (r) => <BarWithValue value={r.onsite} />,
            },
            {
              key: 'offer',
              header: 'Offer rate',
              align: 'right',
              render: (r) => (r.offer ? `${r.offer}%` : 'Suppressed'),
            },
            {
              key: 'ratio',
              header: 'Impact ratio',
              align: 'right',
              render: (r) => (
                <span className={toneText(r.ratio, 0.9, 0.8)}>
                  {r.ratio.toFixed(2)}
                </span>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (r) =>
                r.ratio >= 0.9 ? (
                  <StatusPill tone="success">Within range</StatusPill>
                ) : (
                  <StatusPill tone="warning">Review</StatusPill>
                ),
            },
          ]}
        />
      </SectionCard>
    </div>
  );
}

const NPS_TREND = MONTHS.map((month, i) => ({
  month,
  hired: [62, 64, 63, 66, 68, 67, 70, 71, 69, 72, 74, 73][i],
  rejected: [18, 21, 19, 24, 26, 25, 29, 31, 30, 33, 35, 36][i],
}));

const STAGE_SURVEY = [
  {
    stage: 'Application',
    clarity: 4.1,
    respect: 4.4,
    speed: 3.6,
    responses: 412,
  },
  {
    stage: 'Recruiter screen',
    clarity: 4.5,
    respect: 4.7,
    speed: 4.2,
    responses: 168,
  },
  { stage: 'Technical', clarity: 3.9, respect: 4.5, speed: 3.8, responses: 92 },
  { stage: 'Onsite', clarity: 4.2, respect: 4.6, speed: 3.4, responses: 61 },
  { stage: 'Offer', clarity: 4.6, respect: 4.8, speed: 4.4, responses: 15 },
];

const SLA = [
  { label: 'Application acknowledged', target: '1 hour', met: 99 },
  { label: 'Review decision', target: '5 days', met: 84 },
  { label: 'Interview scheduled', target: '48 hours', met: 91 },
  { label: 'Post-onsite decision', target: '3 days', met: 72 },
  { label: 'Rejection with feedback', target: '7 days', met: 88 },
];

export function CandidateExperienceReport() {
  return (
    <div className="space-y-4">
      <KpiGrid>
        <TrendStat
          label="Candidate NPS"
          value="+48"
          delta={9.1}
          points={NPS_TREND.map((n) => n.hired)}
          className="p-4"
        />
        <TrendStat
          label="Survey response rate"
          value="34"
          unit="%"
          delta={3.0}
          className="p-4"
        />
        <TrendStat
          label="Ghosted candidates"
          value="12"
          delta={-40}
          invertDelta
          className="p-4"
        />
        <TrendStat
          label="Glassdoor interview rating"
          value="4.4"
          unit="/ 5"
          delta={2.3}
          className="p-4"
        />
      </KpiGrid>
      <Grid>
        <SectionCard
          title="NPS by outcome"
          subtitle="Hired vs rejected candidates"
          className="xl:col-span-2"
          bodyClassName="p-4"
        >
          <LineSeriesChart
            data={NPS_TREND}
            xKey="month"
            height={230}
            showLegend
            series={[
              { key: 'hired', label: 'Hired', color: BRAND },
              { key: 'rejected', label: 'Rejected', color: VIOLET },
            ]}
          />
        </SectionCard>
        <SectionCard
          title="Response time SLAs"
          subtitle="Share of candidates within target"
          bodyClassName="space-y-3 p-4"
        >
          {SLA.map((s) => (
            <div key={s.label} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>{s.label}</span>
                <span className={`tabular-nums ${toneText(s.met, 90, 80)}`}>
                  {s.met}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-sm bg-muted">
                  <div
                    className="h-full rounded-sm"
                    style={{
                      width: `${s.met}%`,
                      backgroundColor: thresholdColor(s.met, 90, 80),
                    }}
                  />
                </div>
                <span className="w-16 text-right text-xs text-muted-foreground">
                  {s.target}
                </span>
              </div>
            </div>
          ))}
        </SectionCard>
      </Grid>
      <SectionCard
        title="Survey scores by stage"
        subtitle="Average rating out of 5"
        bodyClassName="p-0"
      >
        <ReportTable
          rows={STAGE_SURVEY}
          getKey={(r) => r.stage}
          columns={[
            {
              key: 'stage',
              header: 'Stage',
              render: (r) => <span className="font-medium">{r.stage}</span>,
            },
            {
              key: 'clarity',
              header: 'Clear process',
              align: 'right',
              render: (r) => (
                <BarWithValue
                  value={r.clarity}
                  max={5}
                  suffix=""
                  color={thresholdColor(r.clarity, 4.2, 3.9)}
                />
              ),
            },
            {
              key: 'respect',
              header: 'Treated with respect',
              align: 'right',
              render: (r) => (
                <BarWithValue
                  value={r.respect}
                  max={5}
                  suffix=""
                  color={thresholdColor(r.respect, 4.2, 3.9)}
                />
              ),
            },
            {
              key: 'speed',
              header: 'Speed',
              align: 'right',
              render: (r) => (
                <BarWithValue
                  value={r.speed}
                  max={5}
                  suffix=""
                  color={thresholdColor(r.speed, 4.2, 3.7)}
                />
              ),
            },
            {
              key: 'responses',
              header: 'Responses',
              align: 'right',
              render: (r) => r.responses,
            },
          ]}
        />
      </SectionCard>
      <p className="text-xs text-muted-foreground">
        Survey sent automatically after each stage. Scores below 3.7 are
        highlighted
      </p>
    </div>
  );
}
