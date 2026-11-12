'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Bot,
  Check,
  FileText,
  ListOrdered,
  Plus,
  ShieldCheck,
  Trash2,
  Workflow,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FilterDropdown,
  SectionCard,
  SegmentedControl,
  ToolbarButton,
} from '@/components/patterns';
import {
  ACTIONS,
  APPROVAL_DESCRIPTION,
  CONDITION_FIELDS,
  CONDITION_OPERATORS,
  CONTEXT_SOURCES,
  JOBS,
  ROLES,
  STAGES,
  TRIGGERS,
  buildInitialConfig,
  roleInstructionsFor,
  uid,
  type ActionId,
  type AgentConfig,
} from './agent-config';
import { AgentFlowPreview } from './agent-flow-preview';
import { AgentTestRun } from './agent-test-run';
import { getStoredAgent, saveAgent } from './agent-store';

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function StepBadge({ n }: { n: number }) {
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#3F6650] text-[11px] font-semibold text-white dark:bg-[#8FBFA1] dark:text-[#0f1a14]">
      {n}
    </span>
  );
}

function ToggleChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'border-[#3F6650] bg-[#EDF1EE] text-[#3F6650] dark:border-[#8FBFA1] dark:bg-[#3F6650]/25 dark:text-[#8FBFA1]'
          : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      {active && <Check className="h-3 w-3" />}
      {children}
    </button>
  );
}

export function AgentBuilder({
  template,
  agentId,
}: {
  template: string | null;
  agentId?: string | null;
}) {
  const router = useRouter();
  const [config, setConfig] = useState<AgentConfig>(
    () =>
      (agentId && getStoredAgent(agentId)?.config) ||
      buildInitialConfig(template),
  );

  const set = <K extends keyof AgentConfig>(key: K, value: AgentConfig[K]) =>
    setConfig((c) => ({ ...c, [key]: value }));

  const toggleIn = (key: 'context' | 'jobs', value: string) =>
    setConfig((c) => ({
      ...c,
      [key]: c[key].includes(value)
        ? c[key].filter((x) => x !== value)
        : [...c[key], value],
    }));

  const updateCondition = (
    id: string,
    patch: Partial<AgentConfig['conditions'][number]>,
  ) =>
    set(
      'conditions',
      config.conditions.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    );

  const moveAction = (index: number, dir: -1 | 1) => {
    const next = [...config.actions];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    set('actions', next);
  };

  const addAction = (type: ActionId) =>
    set('actions', [
      ...config.actions,
      { id: uid('a'), type, config: ACTIONS[type].defaultConfig },
    ]);

  const save = (activate: boolean) => {
    saveAgent({
      id: agentId ?? undefined,
      config,
      status: activate ? 'Active' : 'Draft',
    });
    if (activate)
      toast.success(
        'Agent activated',
        `${config.name} is now listening for new events`,
      );
    else toast.success('Draft saved', config.name);
    router.push('/dashboard/agents');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/agents"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Back to agents"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold">
              {config.name || 'Untitled agent'}
            </h1>
            <p className="text-xs text-muted-foreground">
              Define when the agent runs, what it knows and what it is allowed
              to do
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ToolbarButton
            variant="ghost"
            onClick={() => router.push('/dashboard/agents')}
          >
            Cancel
          </ToolbarButton>
          <ToolbarButton onClick={() => save(false)}>
            Save as draft
          </ToolbarButton>
          <ToolbarButton
            variant="primary"
            icon={Zap}
            onClick={() => save(true)}
            disabled={config.actions.length === 0}
          >
            Activate agent
          </ToolbarButton>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-4">
          <SectionCard
            icon={FileText}
            title="Basics"
            bodyClassName="grid gap-4 p-4 md:grid-cols-2"
          >
            <Field label="Agent name">
              <Input
                value={config.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Inbound screener"
              />
            </Field>
            <Field label="Description">
              <Input
                value={config.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="What this agent is responsible for"
              />
            </Field>
          </SectionCard>

          <SectionCard
            icon={Zap}
            title="Trigger"
            subtitle="The event that starts a run"
            actions={<StepBadge n={1} />}
            bodyClassName="space-y-4 p-4"
          >
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {TRIGGERS.map((t) => {
                const active = config.trigger === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => set('trigger', t.id)}
                    className={cn(
                      'flex items-start gap-2.5 rounded-md border p-3 text-left transition-colors',
                      active
                        ? 'border-[#3F6650] bg-[#EDF1EE] dark:border-[#8FBFA1] dark:bg-[#3F6650]/20'
                        : 'border-border hover:bg-muted/60',
                    )}
                  >
                    <t.icon
                      className={cn(
                        'mt-0.5 h-4 w-4 shrink-0',
                        active
                          ? 'text-[#3F6650] dark:text-[#8FBFA1]'
                          : 'text-muted-foreground',
                      )}
                    />
                    <div>
                      <p className="text-sm font-medium">{t.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.sentence}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="grid gap-4 rounded-md border border-border bg-muted/30 p-3 md:grid-cols-2">
              {config.trigger === 'stage_changed' && (
                <Field label="Stage">
                  <FilterDropdown
                    value={config.stage}
                    options={STAGES.map((s) => ({ label: s, value: s }))}
                    onChange={(v) => set('stage', v)}
                    className="w-full justify-between"
                  />
                </Field>
              )}
              {config.trigger === 'candidate_inactive' && (
                <Field label="Days without activity">
                  <Input
                    type="number"
                    min={1}
                    value={config.inactiveDays}
                    onChange={(e) =>
                      set('inactiveDays', Number(e.target.value) || 1)
                    }
                  />
                </Field>
              )}
              {config.trigger === 'schedule' && (
                <Field label="Cadence">
                  <SegmentedControl
                    value={config.cadence}
                    onChange={(v) => set('cadence', v)}
                    options={[
                      { value: 'daily', label: 'Every weekday' },
                      { value: 'weekly', label: 'Weekly' },
                    ]}
                  />
                </Field>
              )}
              <Field label="Applies to">
                <SegmentedControl
                  value={config.jobScope}
                  onChange={(v) => set('jobScope', v)}
                  options={[
                    { value: 'all', label: 'All jobs' },
                    { value: 'specific', label: 'Specific jobs' },
                  ]}
                />
              </Field>
              {config.jobScope === 'specific' && (
                <div className="md:col-span-2">
                  <Field label="Jobs">
                    <div className="flex flex-wrap gap-1.5">
                      {JOBS.map((j) => (
                        <ToggleChip
                          key={j}
                          active={config.jobs.includes(j)}
                          onClick={() => toggleIn('jobs', j)}
                        >
                          {j}
                        </ToggleChip>
                      ))}
                    </div>
                  </Field>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium">Only run if</p>
                <ToolbarButton
                  variant="ghost"
                  icon={Plus}
                  onClick={() =>
                    set('conditions', [
                      ...config.conditions,
                      {
                        id: uid('c'),
                        field: 'Source',
                        operator: 'is',
                        value: 'LinkedIn',
                      },
                    ])
                  }
                >
                  Add condition
                </ToolbarButton>
              </div>
              {config.conditions.length === 0 && (
                <p className="rounded-md border border-dashed border-border px-3 py-3 text-xs text-muted-foreground">
                  Runs for every matching event. Add a condition to narrow it
                  down
                </p>
              )}
              {config.conditions.map((c, i) => (
                <div key={c.id} className="flex items-center gap-2">
                  <span className="w-10 shrink-0 text-xs text-muted-foreground">
                    {i === 0 ? 'Where' : 'And'}
                  </span>
                  <FilterDropdown
                    value={c.field}
                    options={CONDITION_FIELDS.map((f) => ({
                      label: f,
                      value: f,
                    }))}
                    onChange={(v) => updateCondition(c.id, { field: v })}
                  />
                  <FilterDropdown
                    value={c.operator}
                    options={CONDITION_OPERATORS.map((o) => ({
                      label: o,
                      value: o,
                    }))}
                    onChange={(v) => updateCondition(c.id, { operator: v })}
                  />
                  <Input
                    value={c.value}
                    onChange={(e) =>
                      updateCondition(c.id, { value: e.target.value })
                    }
                    className="h-8 flex-1"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      set(
                        'conditions',
                        config.conditions.filter((x) => x.id !== c.id),
                      )
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Remove condition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            icon={Bot}
            title="Role and context"
            subtitle="Who the agent is and what it can read"
            actions={<StepBadge n={2} />}
            bodyClassName="space-y-4 p-4"
          >
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {ROLES.map((r) => {
                const active = config.role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() =>
                      setConfig((c) => ({
                        ...c,
                        role: r.id,
                        instructions: roleInstructionsFor(r.id),
                      }))
                    }
                    className={cn(
                      'rounded-md border p-3 text-left transition-colors',
                      active
                        ? 'border-[#3F6650] bg-[#EDF1EE] dark:border-[#8FBFA1] dark:bg-[#3F6650]/20'
                        : 'border-border hover:bg-muted/60',
                    )}
                  >
                    <p className="text-sm font-medium">{r.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {r.summary}
                    </p>
                  </button>
                );
              })}
            </div>
            <Field
              label="Instructions"
              hint="Plain language. The agent follows these on every run"
            >
              <Textarea
                rows={5}
                value={config.instructions}
                onChange={(e) => set('instructions', e.target.value)}
                className="text-sm leading-relaxed"
              />
            </Field>
            <Field label="Context the agent can read">
              <div className="flex flex-wrap gap-1.5">
                {CONTEXT_SOURCES.map((s) => (
                  <ToggleChip
                    key={s}
                    active={config.context.includes(s)}
                    onClick={() => toggleIn('context', s)}
                  >
                    {s}
                  </ToggleChip>
                ))}
              </div>
            </Field>
            <Field label="Tone for candidate emails">
              <SegmentedControl
                value={config.tone}
                onChange={(v) => set('tone', v)}
                options={[
                  { value: 'warm', label: 'Warm' },
                  { value: 'neutral', label: 'Neutral' },
                  { value: 'formal', label: 'Formal' },
                ]}
              />
            </Field>
          </SectionCard>

          <SectionCard
            icon={ListOrdered}
            title="Actions"
            subtitle="Steps run in order, each can be reviewed before it applies"
            actions={
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex h-8 items-center gap-1.5 rounded-md border border-input bg-background px-2.5 text-[13px] font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    <Plus className="h-3.5 w-3.5" />
                    Add action
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[14rem]">
                    {(Object.keys(ACTIONS) as ActionId[]).map((id) => {
                      const meta = ACTIONS[id];
                      return (
                        <DropdownMenuItem
                          key={id}
                          onSelect={() => addAction(id)}
                          className="gap-2"
                        >
                          <meta.icon className="h-3.5 w-3.5 text-muted-foreground" />
                          {meta.label}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
                <StepBadge n={3} />
              </div>
            }
            bodyClassName="p-0"
          >
            {config.actions.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                No actions yet
              </p>
            )}
            <ol className="divide-y divide-border">
              {config.actions.map((a, i) => {
                const meta = ACTIONS[a.type];
                return (
                  <li key={a.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="w-4 shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-muted/50">
                      <meta.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </span>
                    <span className="w-52 shrink-0 text-sm font-medium">
                      {meta.label}
                    </span>
                    <Input
                      value={a.config}
                      placeholder={meta.placeholder}
                      onChange={(e) =>
                        set(
                          'actions',
                          config.actions.map((x) =>
                            x.id === a.id
                              ? { ...x, config: e.target.value }
                              : x,
                          ),
                        )
                      }
                      className="h-8 min-w-0 flex-1"
                    />
                    <div className="flex shrink-0 items-center">
                      <button
                        type="button"
                        onClick={() => moveAction(i, -1)}
                        disabled={i === 0}
                        className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                        aria-label="Move up"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveAction(i, 1)}
                        disabled={i === config.actions.length - 1}
                        className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                        aria-label="Move down"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          set(
                            'actions',
                            config.actions.filter((x) => x.id !== a.id),
                          )
                        }
                        className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-red-600 dark:hover:text-red-400"
                        aria-label="Remove action"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>
          </SectionCard>

          <SectionCard
            icon={ShieldCheck}
            title="Guardrails and approval"
            subtitle="Limits that apply to every run"
            actions={<StepBadge n={4} />}
            bodyClassName="space-y-4 p-4"
          >
            <div className="space-y-2">
              <SegmentedControl
                value={config.mode}
                onChange={(v) => set('mode', v)}
                options={[
                  { value: 'suggest', label: 'Suggest only' },
                  { value: 'approval', label: 'Auto with approval' },
                  { value: 'auto', label: 'Fully automatic' },
                ]}
              />
              <p className="text-xs text-muted-foreground">
                {APPROVAL_DESCRIPTION[config.mode]}
              </p>
            </div>
            <div className="divide-y divide-border rounded-md border border-border">
              {(
                [
                  [
                    'hideIdentity',
                    'Hide name, photo and age while scoring',
                    'Reduces bias in screening decisions',
                  ],
                  [
                    'neverAutoReject',
                    'Never reject without a recruiter',
                    'Rejections always land in the review queue',
                  ],
                  [
                    'workingHoursOnly',
                    'Candidate messages in working hours only',
                    'Emails queue until 09:00 in the candidate timezone',
                  ],
                ] as const
              ).map(([key, label, hint]) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-4 px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground">{hint}</p>
                  </div>
                  <Switch
                    checked={config[key]}
                    onCheckedChange={(v) => set(key, v)}
                  />
                </div>
              ))}
              <div className="flex items-center justify-between gap-4 px-3 py-2.5">
                <div>
                  <p className="text-sm">Daily action limit</p>
                  <p className="text-xs text-muted-foreground">
                    The agent pauses and alerts you when reached
                  </p>
                </div>
                <Input
                  type="number"
                  min={1}
                  value={config.dailyLimit}
                  onChange={(e) =>
                    set('dailyLimit', Number(e.target.value) || 1)
                  }
                  className="h-8 w-24 text-right"
                />
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-4 xl:sticky xl:top-0 xl:self-start">
          <SectionCard
            icon={Workflow}
            title="Flow"
            subtitle="Updates as you configure"
            bodyClassName="p-4"
          >
            <AgentFlowPreview config={config} />
          </SectionCard>
          <SectionCard
            icon={Zap}
            title="Test run"
            subtitle="Dry run against a sample candidate"
            bodyClassName="p-4"
          >
            <AgentTestRun config={config} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
