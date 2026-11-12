'use client';

import { useState } from 'react';
import { Loader2, Play } from 'lucide-react';
import {
  FilterDropdown,
  StatusPill,
  Timeline,
  ToolbarButton,
  type TimelineEntry,
} from '@/components/patterns';
import {
  ACTIONS,
  APPROVAL_LABEL,
  ROLES,
  triggerSentence,
  type ActionStep,
  type AgentConfig,
} from './agent-config';

const SAMPLES = [
  {
    value: 'karthik',
    label: 'Karthik Subramanian',
    role: 'Senior Backend Engineer',
    score: 87,
    tags: 'Strong backend, Payments',
  },
  {
    value: 'laura',
    label: 'Laura Fischer',
    role: 'Product Designer',
    score: 82,
    tags: 'Design systems, B2B SaaS',
  },
  {
    value: 'omar',
    label: 'Omar Haddad',
    role: 'Data Analyst',
    score: 64,
    tags: 'SQL, Needs review',
  },
];

function actionOutput(
  step: ActionStep,
  sample: (typeof SAMPLES)[number],
  config: AgentConfig,
): { title: string; body?: string } {
  const first = sample.label.split(' ')[0];
  switch (step.type) {
    case 'score':
      return {
        title: `Score ${sample.score} / 100`,
        body:
          sample.score >= Number(step.config || 0)
            ? `Above threshold of ${step.config}`
            : `Below threshold of ${step.config}, routed to recruiter`,
      };
    case 'tag':
      return { title: `Tags: ${sample.tags}` };
    case 'move_stage':
      return { title: `Moved to ${step.config || 'next stage'}` };
    case 'draft_email':
      return {
        title: 'Drafted email',
        body:
          config.tone === 'formal'
            ? `Dear ${first}, thank you for applying for the ${sample.role} role. We would like to invite you to the next stage of our process.`
            : `Hi ${first}, thanks for applying for the ${sample.role} role. Your experience stood out and we would love to set up a quick call.`,
      };
    case 'scheduling_link':
      return {
        title: 'Scheduling link prepared',
        body: `${step.config}, 6 open slots this week`,
      };
    case 'notify_slack':
      return {
        title: `Posted to ${step.config || 'Slack'}`,
        body: `${sample.label} looks like a strong fit for ${sample.role}`,
      };
    case 'create_task':
      return { title: 'Task created', body: step.config };
  }
}

export function AgentTestRun({ config }: { config: AgentConfig }) {
  const [sampleId, setSampleId] = useState(SAMPLES[0].value);
  const [running, setRunning] = useState(false);
  const [entries, setEntries] = useState<TimelineEntry[]>([]);

  const sample = SAMPLES.find((s) => s.value === sampleId) ?? SAMPLES[0];

  const run = () => {
    setRunning(true);
    setEntries([]);
    const role = ROLES.find((r) => r.id === config.role)?.label ?? 'Agent';
    const steps: TimelineEntry[] = [
      {
        id: 't',
        title: 'Triggered',
        meta: `${triggerSentence(config)} · ${sample.role}`,
        color: '#71717a',
      },
      {
        id: 'c',
        title: `${role} read ${config.context.length} context sources`,
        meta: config.context.join(', ') || 'None',
        color: '#4C6EF5',
      },
      ...config.actions.map((a) => {
        const out = actionOutput(a, sample, config);
        return {
          id: a.id,
          title: out.title,
          meta: ACTIONS[a.type].label,
          body: out.body,
          color: '#3F6650',
        };
      }),
      {
        id: 'approval',
        title:
          config.mode === 'auto'
            ? 'Applied automatically'
            : 'Waiting for recruiter approval',
        meta: APPROVAL_LABEL[config.mode],
        color: config.mode === 'auto' ? '#16a34a' : '#E0A458',
      },
    ];
    steps.forEach((entry, i) => {
      setTimeout(
        () => {
          setEntries((prev) => [...prev, entry]);
          if (i === steps.length - 1) setRunning(false);
        },
        350 * (i + 1),
      );
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <FilterDropdown
          label="Candidate"
          value={sampleId}
          options={SAMPLES.map((s) => ({ label: s.label, value: s.value }))}
          onChange={(v) => {
            setSampleId(v);
            setEntries([]);
          }}
          className="min-w-0 flex-1"
        />
        <ToolbarButton
          variant="primary"
          icon={running ? Loader2 : Play}
          onClick={run}
          disabled={running || config.actions.length === 0}
        >
          {running ? 'Running' : 'Run test'}
        </ToolbarButton>
      </div>
      {entries.length === 0 && !running ? (
        <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
          Run against a sample candidate to preview what the agent would do.
          Nothing is sent.
        </p>
      ) : (
        <div className="rounded-md border border-border p-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Dry run log
            </span>
            <StatusPill tone={running ? 'info' : 'success'} dot>
              {running ? 'Running' : 'Completed'}
            </StatusPill>
          </div>
          <Timeline entries={entries} />
        </div>
      )}
    </div>
  );
}
