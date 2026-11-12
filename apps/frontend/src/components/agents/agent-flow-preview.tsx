'use client';

import * as React from 'react';
import { Bot, Filter, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ACTIONS,
  APPROVAL_LABEL,
  ROLES,
  TRIGGERS,
  triggerSentence,
  type AgentConfig,
} from './agent-config';

function Node({
  kicker,
  icon,
  title,
  children,
  accent,
}: {
  kicker: string;
  icon: React.ReactNode;
  title: React.ReactNode;
  children?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-md border bg-card px-3 py-2.5',
        accent
          ? 'border-[#3F6650]/50 dark:border-[#8FBFA1]/40'
          : 'border-border',
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'flex h-6 w-6 shrink-0 items-center justify-center rounded border',
            accent
              ? 'border-transparent bg-[#3F6650] text-white dark:bg-[#8FBFA1] dark:text-[#0f1a14]'
              : 'border-border bg-muted text-muted-foreground',
          )}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {kicker}
          </p>
          <p className="truncate text-sm font-medium">{title}</p>
        </div>
      </div>
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}

function Connector() {
  return <div className="ml-[22px] h-4 w-px bg-border" />;
}

export function AgentFlowPreview({ config }: { config: AgentConfig }) {
  const trigger = TRIGGERS.find((t) => t.id === config.trigger);
  const TriggerIcon = trigger?.icon ?? Filter;
  const role = ROLES.find((r) => r.id === config.role);
  const scope =
    config.jobScope === 'all' || config.jobs.length === 0
      ? 'All open jobs'
      : `${config.jobs.length} job${config.jobs.length > 1 ? 's' : ''}`;

  return (
    <div>
      <Node
        kicker="Trigger"
        icon={<TriggerIcon className="h-3.5 w-3.5" />}
        title={triggerSentence(config)}
      />
      <Connector />
      <Node
        kicker="Conditions"
        icon={<Filter className="h-3.5 w-3.5" />}
        title={scope}
      >
        {config.conditions.length > 0 ? (
          <ul className="space-y-1">
            {config.conditions.map((c) => (
              <li key={c.id} className="text-xs text-muted-foreground">
                {c.field}{' '}
                <span className="font-medium text-foreground">
                  {c.operator}
                </span>{' '}
                {c.value || '...'}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">No extra filters</p>
        )}
      </Node>
      <Connector />
      <Node
        accent
        kicker="Agent"
        icon={<Bot className="h-3.5 w-3.5" />}
        title={`${config.name || 'Untitled agent'} · ${role?.label ?? ''}`}
      >
        <div className="flex flex-wrap gap-1">
          {config.context.map((c) => (
            <span
              key={c}
              className="rounded border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground"
            >
              {c}
            </span>
          ))}
          {config.context.length === 0 && (
            <span className="text-xs text-muted-foreground">
              No context sources
            </span>
          )}
        </div>
      </Node>
      <Connector />
      <div className="rounded-md border border-border bg-card">
        <p className="border-b border-border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Actions
        </p>
        {config.actions.length === 0 ? (
          <p className="px-3 py-2.5 text-xs text-muted-foreground">
            Add at least one action
          </p>
        ) : (
          <ol className="divide-y divide-border">
            {config.actions.map((a, i) => {
              const meta = ACTIONS[a.type];
              return (
                <li key={a.id} className="flex items-center gap-2 px-3 py-2">
                  <span className="w-4 shrink-0 text-xs tabular-nums text-muted-foreground">
                    {i + 1}
                  </span>
                  <meta.icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm">{meta.label}</span>
                </li>
              );
            })}
          </ol>
        )}
      </div>
      <Connector />
      <Node
        kicker="Approval"
        icon={<ShieldCheck className="h-3.5 w-3.5" />}
        title={APPROVAL_LABEL[config.mode]}
      >
        <p className="text-xs text-muted-foreground">
          {[
            config.hideIdentity && 'Identity hidden',
            config.neverAutoReject && 'No auto-reject',
            config.workingHoursOnly && 'Working hours',
            `${config.dailyLimit} actions per day`,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </Node>
    </div>
  );
}
