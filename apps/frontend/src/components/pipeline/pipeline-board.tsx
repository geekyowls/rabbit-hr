'use client';

import * as React from 'react';
import { AlertTriangle, Archive, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import type {
  ApplicationBoard,
  ApplicationStage,
} from '@/types/application.type';
import { PipelineCard } from './pipeline-card';
import {
  columnCards,
  daysInStage,
  flowStageDefs,
  nextStage,
  slaState,
  type PipelineCandidate,
} from './pipeline-data';

const REJECT_TARGET = 'rejected-drop-target';
const SKELETON_COLUMNS = [0, 1, 2, 3, 4];

export function PipelineBoardSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 gap-2.5 overflow-x-auto pb-1">
      {SKELETON_COLUMNS.map((s) => (
        <div
          key={s}
          className="flex w-[264px] shrink-0 flex-col gap-2 rounded-lg border border-border bg-zinc-50 p-2 dark:bg-zinc-900/60"
        >
          <Skeleton className="h-8 w-full" />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function PipelineBoard({
  board,
  filter,
  rejectedCount,
  canMove,
  showJob,
  onMove,
  onReject,
  onOpenRejected,
  onOpen,
}: {
  board: ApplicationBoard;
  filter: (c: PipelineCandidate) => boolean;
  rejectedCount: number;
  canMove: boolean;
  showJob: boolean;
  onMove: (id: string, stage: ApplicationStage) => void;
  onReject: (id: string) => void;
  onOpenRejected?: () => void;
  onOpen: (card: PipelineCandidate) => void;
}) {
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [overStage, setOverStage] = React.useState<string | null>(null);

  const dropHandlers = (target: string, onDrop: (id: string) => void) => ({
    onDragOver: (e: React.DragEvent) => {
      if (!canMove) return;
      e.preventDefault();
      if (overStage !== target) setOverStage(target);
    },
    onDragLeave: (e: React.DragEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node))
        setOverStage(null);
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      const id = e.dataTransfer.getData('text/plain') || dragId;
      if (id) onDrop(id);
      setDragId(null);
      setOverStage(null);
    },
  });

  const stages = flowStageDefs(board);

  return (
    <div className="flex min-h-0 flex-1 gap-2.5 overflow-x-auto pb-1">
      {stages.map((stage) => {
        const column = board.stages.find((s) => s.stage === stage.id);
        const items = (column ? columnCards(column) : []).filter(filter);
        const total = column?.count ?? 0;
        const avgDays = items.length
          ? items.reduce((s, c) => s + daysInStage(c), 0) / items.length
          : 0;
        const overdue = items.filter((c) => slaState(c) === 'over').length;
        const isOver = overStage === stage.id && dragId !== null;
        const next = nextStage(stages, stage.id);
        return (
          <div
            key={stage.id}
            {...dropHandlers(stage.id, (id) => onMove(id, stage.id))}
            className={cn(
              'flex w-[264px] shrink-0 flex-col rounded-lg border bg-zinc-50 transition-colors dark:bg-zinc-900/60',
              isOver
                ? 'border-[#3F6650] bg-[#EDF1EE] dark:border-[#8FBFA1] dark:bg-[#3F6650]/15'
                : 'border-border',
            )}
          >
            <div className="border-b border-border px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  <span className="truncate text-[13px] font-semibold">
                    {stage.label}
                  </span>
                  <span className="rounded bg-background px-1.5 text-[11px] font-semibold tabular-nums text-muted-foreground ring-1 ring-border">
                    {items.length === total
                      ? total
                      : `${items.length}/${total}`}
                  </span>
                </div>
                {overdue > 0 && (
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 dark:text-red-400">
                          <AlertTriangle className="h-3 w-3" />
                          {overdue}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {overdue} over the {stage.slaDays} day stage target
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {stage.category === 'hired'
                  ? 'Placed this cycle'
                  : items.length
                    ? `Avg ${avgDays.toFixed(1)}d in stage · target ${stage.slaDays}d`
                    : `Target ${stage.slaDays}d`}
              </p>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">
              {items.map((c) => (
                <PipelineCard
                  key={c.id}
                  candidate={c}
                  canAdvance={!!next}
                  canMove={canMove}
                  showJob={showJob}
                  dragging={dragId === c.id}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', c.id);
                    e.dataTransfer.effectAllowed = 'move';
                    setDragId(c.id);
                  }}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverStage(null);
                  }}
                  onOpen={() => onOpen(c)}
                  onAdvance={() => next && onMove(c.id, next.id)}
                  onReject={() => onReject(c.id)}
                />
              ))}
              {items.length === 0 && (
                <div className="rounded-md border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
                  {canMove ? 'Drop candidates here' : 'No candidates'}
                </div>
              )}
              {total > (column?.cards.length ?? 0) && (
                <p className="py-1 text-center text-[11px] text-muted-foreground">
                  Showing the first {column?.cards.length} of {total}
                </p>
              )}
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={onOpenRejected}
        {...dropHandlers(REJECT_TARGET, onReject)}
        className={cn(
          'flex w-11 shrink-0 flex-col items-center gap-2 rounded-lg border bg-zinc-50 py-3 text-muted-foreground hover:text-foreground dark:bg-zinc-900/60',
          overStage === REJECT_TARGET && dragId !== null
            ? 'border-red-300 bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400'
            : 'border-border',
        )}
      >
        <Archive className="h-4 w-4" />
        <span className="text-[11px] font-semibold tabular-nums">
          {rejectedCount}
        </span>
        <span className="text-[11px] font-medium [writing-mode:vertical-rl]">
          Rejected and archived
        </span>
        <ChevronRight className="mt-auto h-3.5 w-3.5" />
      </button>
    </div>
  );
}
