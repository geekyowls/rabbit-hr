'use client';

import { Briefcase, CalendarDays, CalendarPlus } from 'lucide-react';
import { useFormatters } from '@/hooks/use-formatters';
import { useApplicationInterviewsQuery } from '@/hooks/queries';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';
import { PermissionGuard } from '@/components/auth/permission-guard';
import {
  AvatarStack,
  EmptyState,
  RatingStars,
  StatusPill,
  ToolbarButton,
} from '@/components/patterns';
import { Skeleton } from '@/components/ui/skeleton';
import {
  INTERVIEW_STATUS_LABEL,
  INTERVIEW_STATUS_TONE,
  INTERVIEW_TYPE_LABEL,
  formatDuration,
  personLabel,
} from '@/components/interviews/interview-data';
import type {
  CandidateApplicationSummary,
  CandidateDetail,
} from '@/types/candidate.type';

function ApplicationInterviews({
  app,
  onOpen,
  onSchedule,
}: {
  app: CandidateApplicationSummary;
  onOpen: (interviewId: string) => void;
  onSchedule: (app: CandidateApplicationSummary) => void;
}) {
  const fmt = useFormatters();
  const { data = [], isLoading } = useApplicationInterviewsQuery(app.id);
  const interviews = [...data].sort(
    (a, b) =>
      new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
  );

  return (
    <div className="space-y-2 rounded-md border border-border px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="truncate text-sm font-medium">
            {app.jobTitle}
            {app.clientName && (
              <span className="font-normal text-muted-foreground">
                {' '}
                · {app.clientName}
              </span>
            )}
          </p>
        </div>
        <PermissionGuard permissions={PERMISSIONS_ENUM.INTERVIEW_CREATE}>
          <ToolbarButton icon={CalendarPlus} onClick={() => onSchedule(app)}>
            Schedule
          </ToolbarButton>
        </PermissionGuard>
      </div>
      {isLoading && <Skeleton className="h-10 w-full" />}
      {!isLoading && interviews.length === 0 && (
        <p className="text-xs text-muted-foreground">No interviews yet</p>
      )}
      {interviews.length > 0 && (
        <ul className="divide-y divide-border rounded-md border border-border">
          {interviews.map((i) => (
            <li key={i.id}>
              <button
                type="button"
                onClick={() => onOpen(i.id)}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-accent/50"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{i.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {INTERVIEW_TYPE_LABEL[i.type]} · {fmt.date(i.scheduledAt)}{' '}
                    {fmt.time(i.scheduledAt)} ·{' '}
                    {formatDuration(i.durationMinutes)}
                  </span>
                </span>
                <AvatarStack
                  items={i.interviewers.map((p) => ({ name: personLabel(p) }))}
                  max={3}
                  size={20}
                />
                <span className="flex w-28 items-center justify-end gap-1.5 text-xs tabular-nums text-muted-foreground">
                  {i.scorecardCount}/{i.interviewerCount}
                  {i.averageRating !== null && (
                    <RatingStars value={i.averageRating} size={11} />
                  )}
                </span>
                {i.feedbackDue ? (
                  <StatusPill tone="warning" dot>
                    Feedback due
                  </StatusPill>
                ) : (
                  <StatusPill tone={INTERVIEW_STATUS_TONE[i.status]} dot>
                    {INTERVIEW_STATUS_LABEL[i.status]}
                  </StatusPill>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CandidateInterviewsTab({
  candidate,
  onOpen,
  onSchedule,
}: {
  candidate: CandidateDetail;
  onOpen: (interviewId: string) => void;
  onSchedule: (app: CandidateApplicationSummary) => void;
}) {
  if (candidate.applications.length === 0) {
    return (
      <EmptyState
        compact
        icon={<CalendarDays className="h-5 w-5" />}
        title="No applications yet"
        description="Add this candidate to a job to schedule interviews"
      />
    );
  }
  return (
    <div className="space-y-3">
      {candidate.applications.map((app) => (
        <ApplicationInterviews
          key={app.id}
          app={app}
          onOpen={onOpen}
          onSchedule={onSchedule}
        />
      ))}
    </div>
  );
}
