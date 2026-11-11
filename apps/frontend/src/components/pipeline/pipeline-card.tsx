'use client';

import * as React from 'react';
import {
  ArrowRight,
  Briefcase,
  Building2,
  Clock,
  Globe,
  Star,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { InitialsAvatar } from '@/components/ui/initials-avatar';
import { LinkedInIcon } from '@/components/icons/brand-icons';
import { AvatarStack, RatingStars } from '@/components/patterns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { CandidateSource } from '@/types/candidate.type';
import { SOURCE_LABEL } from '@/components/applications/application-meta';
import {
  SAMPLE_NEXT_STEP,
  daysInStage,
  sampleInterviewers,
  sampleMatchScore,
  slaState,
  type PipelineCandidate,
} from './pipeline-data';

const SOURCE_META: Partial<
  Record<CandidateSource, { icon: LucideIcon; color: string }>
> = {
  referral: { icon: Users, color: '#3F6650' },
  careers_page: { icon: Globe, color: '#8B7DD8' },
  agency_database: { icon: Building2, color: '#E0A458' },
  indeed: { icon: Briefcase, color: '#2164F3' },
  reed: { icon: Briefcase, color: '#C4122F' },
  totaljobs: { icon: Briefcase, color: '#0A66C2' },
  cv_library: { icon: Briefcase, color: '#E0533D' },
};

export function SourceBadge({ source }: { source: CandidateSource }) {
  if (source === 'linkedin') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
        <LinkedInIcon className="h-3 w-3" />
        LinkedIn
      </span>
    );
  }
  const meta = SOURCE_META[source];
  const Icon = meta?.icon ?? Globe;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
      <Icon
        className="h-3 w-3"
        style={meta ? { color: meta.color } : undefined}
      />
      {SOURCE_LABEL[source]}
    </span>
  );
}

export function AgentScore({ score }: { score: number }) {
  return (
    <span
      title="Sample match score, not integrated"
      className={cn(
        'inline-flex items-center rounded-sm border border-dashed px-1.5 py-px text-[10px] font-semibold tabular-nums',
        score >= 80
          ? 'border-green-300 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400'
          : score >= 65
            ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400'
            : 'border-zinc-300 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400',
      )}
    >
      Match {score}
    </span>
  );
}

function QuickAction({
  label,
  icon: Icon,
  onClick,
  tone,
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  tone?: 'danger';
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={label}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded border border-border bg-background text-muted-foreground shadow-sm',
              tone === 'danger'
                ? 'hover:border-red-200 hover:text-red-600 dark:hover:border-red-900 dark:hover:text-red-400'
                : 'hover:text-foreground',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function PipelineCard({
  candidate: c,
  canAdvance,
  canMove,
  showJob,
  onOpen,
  onAdvance,
  onReject,
  dragging,
  onDragStart,
  onDragEnd,
}: {
  candidate: PipelineCandidate;
  canAdvance: boolean;
  canMove: boolean;
  showJob: boolean;
  onOpen: () => void;
  onAdvance: () => void;
  onReject: () => void;
  dragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}) {
  const sla = slaState(c);
  const days = daysInStage(c);
  const interviewers = sampleInterviewers(c);
  return (
    <div
      role="button"
      tabIndex={0}
      draggable={canMove}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      className={cn(
        'group relative rounded-md border border-border bg-card p-2.5 text-left shadow-sm transition-shadow hover:border-zinc-300 hover:shadow-md dark:hover:border-zinc-600',
        canMove ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
        dragging && 'opacity-40',
      )}
    >
      {canMove && (
        <div className="absolute right-2 top-2 hidden items-center gap-1 group-hover:flex">
          {canAdvance && (
            <QuickAction
              label="Move to next stage"
              icon={ArrowRight}
              onClick={onAdvance}
            />
          )}
          <QuickAction
            label="Reject"
            icon={X}
            onClick={onReject}
            tone="danger"
          />
        </div>
      )}

      <div className="flex items-start gap-2">
        <InitialsAvatar
          name={c.candidateName}
          className="mt-0.5 h-7 w-7 shrink-0 text-[10px]"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <p className="truncate text-[13px] font-semibold leading-tight">
              {c.candidateName}
            </p>
            {c.shortlisted && (
              <Star
                aria-label="Shortlisted"
                className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400"
              />
            )}
          </div>
          <p className="truncate text-[11px] text-muted-foreground">
            {c.candidateHeadline ?? c.candidateLocation ?? 'No headline'}
          </p>
          {showJob && (
            <p className="truncate text-[11px] text-foreground/80">
              {c.jobTitle}
              {c.clientName ? `, ${c.clientName}` : ''}
            </p>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <SourceBadge source={c.source} />
        {c.rating ? (
          <RatingStars value={c.rating} size={11} />
        ) : (
          <AgentScore score={sampleMatchScore(c.id)} />
        )}
      </div>

      {(c.candidateTags.length > 0 || !!c.rating) && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {!!c.rating && <AgentScore score={sampleMatchScore(c.id)} />}
          {c.candidateTags.slice(0, 3).map((t) => (
            <span
              key={t}
              className="rounded-sm bg-zinc-100 px-1.5 py-px text-[10px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between gap-2 border-t border-border pt-2">
        <span
          title="Sample next step, not integrated"
          className="truncate text-[11px] font-medium text-foreground/60"
        >
          {SAMPLE_NEXT_STEP[c.stage]}
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          {interviewers.length > 0 && (
            <AvatarStack
              items={interviewers.map((name) => ({ name }))}
              max={3}
              size={18}
            />
          )}
          <span
            title={`${days} days in stage`}
            className={cn(
              'inline-flex items-center gap-0.5 text-[11px] tabular-nums',
              sla === 'over'
                ? 'font-semibold text-red-600 dark:text-red-400'
                : sla === 'warn'
                  ? 'font-medium text-amber-600 dark:text-amber-400'
                  : 'text-muted-foreground',
            )}
          >
            <Clock className="h-3 w-3" />
            {days}d
          </span>
        </div>
      </div>
    </div>
  );
}
