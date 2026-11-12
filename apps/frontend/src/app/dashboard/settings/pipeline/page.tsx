'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  GripVertical,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';
import { useBreadcrumb } from '@/contexts/breadcrumb-context';
import {
  usePipelineStagesQuery,
  useReplacePipelineStagesMutation,
} from '@/hooks/queries';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState, ToolbarButton } from '@/components/patterns';
import {
  STAGE_CATEGORY_LABEL,
  STAGE_COLOR_TOKENS,
  errorMessage,
  stageColor,
} from '@/components/applications/application-meta';
import {
  PIPELINE_STAGE_CATEGORIES,
  type PipelineStage,
  type PipelineStageCategory,
  type PipelineStageMove,
} from '@/types/pipeline-stage.type';

const TYPE_HINT: Record<PipelineStageCategory, string> = {
  applied: 'New applications land here',
  screening: 'Early checks and phone screens',
  interview: 'Scheduling an interview moves candidates here',
  offer: 'Sending an offer moves candidates here',
  hired: 'Accepting an offer moves candidates here and counts as a placement',
  rejected: 'Asks for a reason and counts as a rejection',
  withdrawn: 'The candidate pulled out',
};

const MAX_STAGES = 30;
const REQUIRED_CATEGORIES: PipelineStageCategory[] = [
  'hired',
  'rejected',
  'withdrawn',
];

interface DraftStage {
  uid: string;
  key?: string;
  name: string;
  category: PipelineStageCategory;
  color: string;
  isActive: boolean;
  applicationCount: number;
}

interface PendingRetire {
  stage: DraftStage;
  mode: 'remove' | 'deactivate';
}

let uidSeq = 0;
const nextUid = () => `new-${++uidSeq}`;

function toDraft(stages: PipelineStage[]): DraftStage[] {
  return [...stages]
    .sort((a, b) => a.order - b.order)
    .map((s) => ({
      uid: s.id,
      key: s.key,
      name: s.name,
      category: s.category,
      color: s.color,
      isActive: s.isActive,
      applicationCount: s.applicationCount,
    }));
}

function snapshot(stages: DraftStage[]) {
  return JSON.stringify(
    stages.map(({ key, name, category, color, isActive }) => ({
      key,
      name,
      category,
      color,
      isActive,
    })),
  );
}

function validate(stages: DraftStage[], moves: PipelineStageMove[]) {
  const issues: string[] = [];
  const active = stages.filter((s) => s.isActive);
  if (stages.length > MAX_STAGES) {
    issues.push(`Use at most ${MAX_STAGES} stages`);
  }
  if (stages.some((s) => !s.name.trim())) {
    issues.push('Every stage needs a name');
  }
  if (active[0]?.category !== 'applied') {
    issues.push('The first active stage must be in the applied category');
  }
  if (active.filter((s) => s.category === 'applied').length !== 1) {
    issues.push('Keep exactly one active applied stage');
  }
  const missing = REQUIRED_CATEGORIES.filter(
    (c) => !active.some((s) => s.category === c),
  );
  if (missing.length > 0) {
    issues.push(
      `Add an active stage for: ${missing.map((c) => STAGE_CATEGORY_LABEL[c].toLowerCase()).join(', ')}`,
    );
  }
  const activeKeys = new Set(active.map((s) => s.key).filter(Boolean));
  if (moves.some((m) => !activeKeys.has(m.toKey))) {
    issues.push(
      'Applications are set to move to a stage that is no longer active',
    );
  }
  return issues;
}

function ColorPicker({
  stage,
  onChange,
}: {
  stage: DraftStage;
  onChange: (color: string) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Stage colour"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border hover:bg-muted"
        >
          <span
            className="h-3.5 w-3.5 rounded-full"
            style={{ backgroundColor: stageColor(stage) }}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="grid grid-cols-7 gap-1.5">
          {STAGE_COLOR_TOKENS.map((token) => (
            <button
              key={token}
              type="button"
              aria-label={token}
              onClick={() => onChange(token)}
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-md border',
                stage.color === token
                  ? 'border-foreground'
                  : 'border-transparent hover:border-border',
              )}
            >
              <span
                className="h-4 w-4 rounded-full"
                style={{
                  backgroundColor: stageColor({
                    color: token,
                    category: stage.category,
                  }),
                }}
              />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function MoveDialog({
  pending,
  targets,
  onCancel,
  onConfirm,
}: {
  pending: PendingRetire | null;
  targets: DraftStage[];
  onCancel: () => void;
  onConfirm: (toKey: string) => void;
}) {
  const [toKey, setToKey] = useState('');

  useEffect(() => {
    setToKey(targets[0]?.key ?? '');
  }, [pending, targets]);

  const stage = pending?.stage;
  const count = stage?.applicationCount ?? 0;

  return (
    <Dialog open={!!pending} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {pending?.mode === 'remove' ? 'Remove stage' : 'Deactivate stage'}
          </DialogTitle>
          <DialogDescription>
            {stage?.name} has {count}{' '}
            {count === 1 ? 'application' : 'applications'}. Choose where to move
            them when you save.
          </DialogDescription>
        </DialogHeader>
        {targets.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Save another active stage first, then try again
          </p>
        ) : (
          <Select value={toKey} onValueChange={setToKey}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Move applications to" />
            </SelectTrigger>
            <SelectContent>
              {targets.map((t) => (
                <SelectItem key={t.uid} value={t.key ?? ''}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!toKey}
            onClick={() => toKey && onConfirm(toKey)}
          >
            {pending?.mode === 'remove'
              ? 'Remove and move'
              : 'Deactivate and move'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PipelineSettingsContent() {
  useBreadcrumb([
    { label: 'Settings', href: '/dashboard/settings' },
    { label: 'Pipeline stages', active: true },
  ]);
  const { data, isLoading, error } = usePipelineStagesQuery();
  const replace = useReplacePipelineStagesMutation();
  const [stages, setStages] = useState<DraftStage[]>([]);
  const [moves, setMoves] = useState<PipelineStageMove[]>([]);
  const [pending, setPending] = useState<PendingRetire | null>(null);
  const [dragUid, setDragUid] = useState<string | null>(null);

  const reset = (source: PipelineStage[] | undefined) => {
    setStages(toDraft(source ?? []));
    setMoves([]);
  };

  useEffect(() => {
    if (!data) return;
    setStages(toDraft(data));
    setMoves([]);
  }, [data]);

  const issues = useMemo(() => validate(stages, moves), [stages, moves]);
  const dirty =
    !!data &&
    (snapshot(stages) !== snapshot(toDraft(data)) || moves.length > 0);

  const patch = (uid: string, changes: Partial<DraftStage>) =>
    setStages((list) =>
      list.map((s) => (s.uid === uid ? { ...s, ...changes } : s)),
    );

  const move = (from: number, to: number) =>
    setStages((list) => {
      if (to < 0 || to >= list.length || from === to) return list;
      const next = [...list];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });

  const addStage = () =>
    setStages((list) => {
      const firstClosed = list.findIndex((s) =>
        ['hired', 'rejected', 'withdrawn'].includes(s.category),
      );
      const index = firstClosed === -1 ? list.length : firstClosed;
      const next = [...list];
      next.splice(index, 0, {
        uid: nextUid(),
        name: 'New stage',
        category: 'screening',
        color: 'blue',
        isActive: true,
        applicationCount: 0,
      });
      return next;
    });

  const needsMove = (stage: DraftStage) =>
    !!stage.key && stage.applicationCount > 0;

  const removeStage = (stage: DraftStage) => {
    if (needsMove(stage) && !moves.some((m) => m.fromKey === stage.key)) {
      setPending({ stage, mode: 'remove' });
      return;
    }
    setStages((list) => list.filter((s) => s.uid !== stage.uid));
  };

  const toggleActive = (stage: DraftStage, isActive: boolean) => {
    if (isActive) {
      patch(stage.uid, { isActive });
      setMoves((list) => list.filter((m) => m.fromKey !== stage.key));
      return;
    }
    if (needsMove(stage) && !moves.some((m) => m.fromKey === stage.key)) {
      setPending({ stage, mode: 'deactivate' });
      return;
    }
    patch(stage.uid, { isActive });
  };

  const confirmMove = (toKey: string) => {
    if (!pending) return;
    const { stage, mode } = pending;
    setMoves((list) => [
      ...list.filter((m) => m.fromKey !== stage.key),
      { fromKey: stage.key!, toKey },
    ]);
    if (mode === 'remove') {
      setStages((list) => list.filter((s) => s.uid !== stage.uid));
    } else {
      patch(stage.uid, { isActive: false });
    }
    setPending(null);
  };

  const moveTargets = useMemo(
    () =>
      stages.filter((s) => s.isActive && s.key && s.uid !== pending?.stage.uid),
    [stages, pending],
  );

  const save = async () => {
    if (issues.length > 0) {
      toast.error('Fix the pipeline first', issues[0]);
      return;
    }
    try {
      await replace.mutateAsync({
        stages: stages.map((s) => ({
          ...(s.key ? { key: s.key } : {}),
          name: s.name.trim(),
          category: s.category,
          color: s.color,
          isActive: s.isActive,
        })),
        ...(moves.length > 0 ? { moves } : {}),
      });
      toast.success('Pipeline saved');
    } catch (err) {
      toast.error('Could not save pipeline', errorMessage(err));
    }
  };

  const moveLabel = (stage: DraftStage) => {
    const m = moves.find((x) => x.fromKey === stage.key);
    if (!m) return null;
    const target = stages.find((s) => s.key === m.toKey);
    return `Applications move to ${target?.name ?? m.toKey}`;
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Pipeline stages"
        description="Name each step your team sees, then pick its type so RabbitHR knows what it means"
        backHref="/dashboard/settings"
        actions={
          <div className="flex items-center gap-2">
            <ToolbarButton
              icon={Plus}
              onClick={addStage}
              disabled={stages.length >= MAX_STAGES}
            >
              Add stage
            </ToolbarButton>
            <Button
              variant="outline"
              size="sm"
              disabled={!dirty || replace.isPending}
              onClick={() => reset(data)}
            >
              Discard
            </Button>
            <Button
              size="sm"
              disabled={!dirty || replace.isPending}
              onClick={save}
            >
              Save changes
            </Button>
          </div>
        }
      />

      {issues.length > 0 && stages.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <ul className="space-y-0.5">
            {issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          title="Could not load stages"
          description={error.message || 'Please try again in a moment'}
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
            <span className="w-[4.75rem] shrink-0" />
            <span className="min-w-[160px] flex-1">Stage name</span>
            <span className="w-36">Type</span>
            <span className="w-24 text-right">Applications</span>
            <span className="w-[3.25rem] text-center">Active</span>
            <span className="w-[5.25rem]" />
          </div>
          <ul className="divide-y divide-border">
            {stages.map((stage, index) => {
              const note = moveLabel(stage);
              return (
                <li
                  key={stage.uid}
                  draggable
                  onDragStart={(e) => {
                    setDragUid(stage.uid);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragOver={(e) => {
                    if (!dragUid) return;
                    e.preventDefault();
                    const from = stages.findIndex((s) => s.uid === dragUid);
                    if (from !== index) {
                      move(from, index);
                    }
                  }}
                  onDragEnd={() => setDragUid(null)}
                  className={cn(
                    'flex flex-wrap items-center gap-2 px-3 py-2',
                    !stage.isActive && 'bg-muted/40',
                    dragUid === stage.uid && 'opacity-60',
                  )}
                >
                  <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground" />
                  <span className="w-5 text-right text-xs tabular-nums text-muted-foreground">
                    {index + 1}
                  </span>
                  <ColorPicker
                    stage={stage}
                    onChange={(color) => patch(stage.uid, { color })}
                  />
                  <div className="min-w-[160px] flex-1">
                    <Input
                      className="h-8"
                      value={stage.name}
                      maxLength={100}
                      aria-label="Stage name"
                      onChange={(e) =>
                        patch(stage.uid, { name: e.target.value })
                      }
                    />
                    {note && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {note}
                      </p>
                    )}
                  </div>
                  <Select
                    value={stage.category}
                    onValueChange={(v) =>
                      patch(stage.uid, {
                        category: v as PipelineStageCategory,
                      })
                    }
                  >
                    <SelectTrigger
                      className="h-8 w-36"
                      aria-label="Type"
                      title={TYPE_HINT[stage.category]}
                    >
                      <span>{STAGE_CATEGORY_LABEL[stage.category]}</span>
                    </SelectTrigger>
                    <SelectContent>
                      {PIPELINE_STAGE_CATEGORIES.map((c) => (
                        <SelectItem
                          key={c}
                          value={c}
                          textValue={STAGE_CATEGORY_LABEL[c]}
                        >
                          <div className="flex flex-col">
                            <span>{STAGE_CATEGORY_LABEL[c]}</span>
                            <span className="text-xs text-muted-foreground">
                              {TYPE_HINT[c]}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="w-24 text-right text-sm tabular-nums text-muted-foreground">
                    {stage.applicationCount}
                  </span>
                  <span className="flex w-[3.25rem] justify-center">
                    <Switch
                      checked={stage.isActive}
                      onCheckedChange={(v) => toggleActive(stage, v)}
                      aria-label="Active"
                    />
                  </span>
                  <div className="flex items-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={index === 0}
                      onClick={() => move(index, index - 1)}
                      aria-label="Move up"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={index === stages.length - 1}
                      onClick={() => move(index, index + 1)}
                      aria-label="Move down"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
                      onClick={() => removeStage(stage)}
                      aria-label="Remove stage"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <MoveDialog
        pending={pending}
        targets={moveTargets}
        onCancel={() => setPending(null)}
        onConfirm={confirmMove}
      />
    </div>
  );
}

export default function PipelineSettingsPage() {
  return (
    <PermissionGuard
      permissions={PERMISSIONS_ENUM.PIPELINE_STAGE_MANAGE}
      fallback={
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          You don&apos;t have permission to manage pipeline stages
        </div>
      }
    >
      <PipelineSettingsContent />
    </PermissionGuard>
  );
}
