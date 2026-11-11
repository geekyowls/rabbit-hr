'use client';

import { Building2, CalendarDays, MapPin, Users } from 'lucide-react';
import { InitialsAvatar } from '@/components/ui/initials-avatar';
import { NotIntegratedBadge, StatusPill } from '@/components/patterns';
import type { JobDetail } from '@/types/job.type';
import type { StageCounts } from '@/types/application.type';
import {
  daysSince,
  userLabel,
} from '@/components/applications/application-meta';
import { STAGES, STAGE_INDEX } from './pipeline-data';

const WORK_MODE_LABEL: Record<JobDetail['workMode'], string> = {
  onsite: 'Onsite',
  hybrid: 'Hybrid',
  remote: 'Remote',
};

const JOB_STATUS_LABEL: Record<JobDetail['status'], string> = {
  draft: 'Draft',
  published: 'Published',
  on_hold: 'On hold',
  closed: 'Closed',
  filled: 'Filled',
};

function Person({
  label,
  name,
  badge,
}: {
  label: string;
  name: string;
  badge?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <InitialsAvatar name={name} className="h-5 w-5 text-[9px]" />
      <div className="leading-tight">
        <p className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
          {label}
          {badge && <NotIntegratedBadge className="px-1 py-0 text-[9px]" />}
        </p>
        <p className="text-xs font-medium">{name}</p>
      </div>
    </div>
  );
}

export function JobSummary({
  job,
  counts,
  jobCount,
}: {
  job: JobDetail | null;
  counts: StageCounts;
  jobCount: number;
}) {
  const inStage = STAGES.map((s) => counts[s.id] ?? 0);
  const reached = STAGES.map((s) =>
    STAGES.filter((t) => (STAGE_INDEX[t.id] ?? 0) >= (STAGE_INDEX[s.id] ?? 0))
      .map((t) => counts[t.id] ?? 0)
      .reduce((a, b) => a + b, 0),
  );
  const placed = counts.placed ?? 0;
  const closed = (counts.rejected ?? 0) + (counts.withdrawn ?? 0);

  return (
    <div className="flex flex-wrap items-stretch gap-x-6 gap-y-3 rounded-lg border border-border bg-card px-4 py-3">
      <div className="min-w-[220px] space-y-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">
            {job ? job.title : 'All jobs'}
          </p>
          {job && (
            <span className="font-mono text-[11px] text-muted-foreground">
              {job.reference}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          {job ? (
            <>
              {job.client && (
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {job.client.name}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {[job.location, WORK_MODE_LABEL[job.workMode]]
                  .filter(Boolean)
                  .join(', ')}
              </span>
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                Open {daysSince(job.publishedAt ?? job.createdAt)}d
              </span>
              <span className="inline-flex items-center gap-1">
                <Users className="h-3 w-3" />
                {placed} of {job.openings} filled
              </span>
              <StatusPill
                tone={job.status === 'published' ? 'success' : 'neutral'}
              >
                {JOB_STATUS_LABEL[job.status]}
              </StatusPill>
            </>
          ) : (
            <>
              <span>{jobCount} jobs</span>
              <span className="inline-flex items-center gap-1">
                <Users className="h-3 w-3" />
                {placed} placed
              </span>
              <span>{closed} rejected or withdrawn</span>
            </>
          )}
        </div>
      </div>

      {job && (
        <div className="flex items-center gap-4 border-l border-border pl-6">
          <Person label="Hiring manager" name="Rohit Sharma" badge />
          <Person
            label="Recruiter"
            name={userLabel(job.owner) || 'Unassigned'}
          />
        </div>
      )}

      <div className="ml-auto flex min-w-[420px] flex-1 items-stretch overflow-hidden rounded-md border border-border">
        {STAGES.map((s, i) => {
          const conv =
            i > 0 && reached[i - 1] > 0
              ? Math.round((reached[i] / reached[i - 1]) * 100)
              : null;
          return (
            <div
              key={s.id}
              className="flex flex-1 flex-col justify-center border-r border-border px-2 py-1.5 last:border-r-0"
            >
              <div className="flex items-center gap-1">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                <span className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {s.label}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-semibold tabular-nums">
                  {inStage[i]}
                </span>
                {conv !== null && (
                  <span className="text-[10px] tabular-nums text-muted-foreground">
                    {conv}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
