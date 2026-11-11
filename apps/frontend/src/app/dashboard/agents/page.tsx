'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CalendarClock,
  ArrowRight,
  Check,
  FileSearch,
  History,
  ListChecks,
  Minus,
  PhoneCall,
  Plus,
  Trash2,
  Settings2,
  Zap,
  UserSearch,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { InitialsAvatar } from '@/components/ui/initials-avatar';
import {
  TEMPLATES,
  TRIGGERS,
  triggerSentence,
} from '@/components/agents/agent-config';
import {
  deleteAgent,
  setAgentEnabled,
  useStoredAgents,
} from '@/components/agents/agent-store';
import {
  NotIntegratedBadge,
  SectionCard,
  SegmentedControl,
  StatusPill,
  Timeline,
  ToolbarButton,
} from '@/components/patterns';

interface Agent {
  id: string;
  href: string;
  status?: 'New' | 'Draft';
  custom?: boolean;
  name: string;
  description: string;
  icon: LucideIcon;
  trigger: string;
  enabled: boolean;
  scope: string;
  runs: number;
  agreement: string;
  lastRun: string;
}

const AGENTS: Agent[] = [
  {
    id: 'screen',
    href: '/dashboard/agents/new?template=screen',
    name: 'Application screening',
    description:
      'Scores new applications against the role scorecard and drafts a shortlist',
    icon: FileSearch,
    trigger: 'When an application is received',
    enabled: true,
    scope: '9 roles',
    runs: 246,
    agreement: '91% recruiter agreement',
    lastRun: '4 min ago',
  },
  {
    id: 'schedule',
    href: '/dashboard/agents/new?template=scorecards',
    name: 'Interview scheduling',
    description: 'Finds panel availability and sends candidates booking links',
    icon: CalendarClock,
    trigger: 'When a candidate moves to Phone screen',
    enabled: true,
    scope: 'All roles',
    runs: 58,
    agreement: '1.6 h median to book',
    lastRun: '22 min ago',
  },
  {
    id: 'source',
    href: '/dashboard/agents/new?template=rediscover',
    name: 'Talent rediscovery',
    description:
      'Searches past applicants and silver medalists for new openings',
    icon: UserSearch,
    trigger: 'When a new job is published',
    enabled: true,
    scope: '4 roles',
    runs: 12,
    agreement: '37 profiles surfaced',
    lastRun: '2 h ago',
  },
  {
    id: 'reference',
    href: '/dashboard/agents/new',
    name: 'Reference checks',
    description: 'Collects structured reference feedback by email before offer',
    icon: PhoneCall,
    trigger: 'When a candidate reaches Offer',
    enabled: false,
    scope: 'Offer stage',
    runs: 0,
    agreement: 'Not running',
    lastRun: 'Never',
  },
];

type Criterion = { label: string; met: 'yes' | 'partial' | 'no' };

interface Recommendation {
  id: string;
  candidate: string;
  role: string;
  source: string;
  score: number;
  verdict: 'Advance' | 'Review' | 'Decline';
  summary: string;
  criteria: Criterion[];
}

const QUEUE: Recommendation[] = [
  {
    id: 'r1',
    candidate: 'Karthik Subramanian',
    role: 'Senior Backend Engineer',
    source: 'LinkedIn',
    score: 92,
    verdict: 'Advance',
    summary:
      '7 years building payment APIs in Go and Postgres, led a team of 4 at a Series B fintech',
    criteria: [
      { label: '5+ years backend', met: 'yes' },
      { label: 'Go or Java', met: 'yes' },
      { label: 'Distributed systems', met: 'yes' },
      { label: 'Based in India', met: 'yes' },
    ],
  },
  {
    id: 'r2',
    candidate: 'Laura Fischer',
    role: 'Product Designer',
    source: 'Careers page',
    score: 84,
    verdict: 'Advance',
    summary:
      'B2B SaaS designer with a strong systems portfolio, shipped a design system used by 30 engineers',
    criteria: [
      { label: 'B2B SaaS', met: 'yes' },
      { label: 'Design systems', met: 'yes' },
      { label: 'User research', met: 'partial' },
      { label: 'Portfolio link', met: 'yes' },
    ],
  },
  {
    id: 'r3',
    candidate: 'Omar Haddad',
    role: 'Data Analyst',
    source: 'Referral',
    score: 68,
    verdict: 'Review',
    summary:
      'Strong SQL and dbt, limited stakeholder-facing work. Referred by Neha Reddy',
    criteria: [
      { label: 'Advanced SQL', met: 'yes' },
      { label: 'BI tooling', met: 'yes' },
      { label: 'Stakeholder reporting', met: 'partial' },
      { label: 'Experimentation', met: 'no' },
    ],
  },
  {
    id: 'r4',
    candidate: 'Grace Lee',
    role: 'DevOps Engineer',
    source: 'Agency',
    score: 41,
    verdict: 'Decline',
    summary:
      'Background mostly in on-prem infrastructure, no Kubernetes or Terraform experience listed',
    criteria: [
      { label: 'Kubernetes', met: 'no' },
      { label: 'Terraform', met: 'no' },
      { label: 'AWS or GCP', met: 'partial' },
      { label: 'On-call experience', met: 'yes' },
    ],
  },
  {
    id: 'r5',
    candidate: 'Ravi Menon',
    role: 'Product Manager, Growth',
    source: 'LinkedIn',
    score: 79,
    verdict: 'Advance',
    summary:
      'Ran activation and pricing experiments at a consumer subscription app, ex-analyst',
    criteria: [
      { label: 'Growth experiments', met: 'yes' },
      { label: 'B2B experience', met: 'partial' },
      { label: 'SQL fluency', met: 'yes' },
      { label: '4+ years PM', met: 'yes' },
    ],
  },
];

const VERDICT_TONE = {
  Advance: 'success',
  Review: 'warning',
  Decline: 'danger',
} as const;

const LOG = [
  {
    id: 'l1',
    title: 'Screened 14 applications',
    meta: 'Application screening · Product Manager, Growth',
    time: '4m ago',
    color: '#3F6650',
  },
  {
    id: 'l2',
    title: 'Booked onsite for Lucas Becker',
    meta: 'Interview scheduling · 4 panelists, Tue 09:30',
    time: '22m ago',
    color: '#4C6EF5',
  },
  {
    id: 'l3',
    title: 'Recruiter overrode 1 recommendation',
    meta: 'Omar Haddad moved to phone screen by Neha Reddy',
    time: '1h ago',
    color: '#E0A458',
  },
  {
    id: 'l4',
    title: 'Surfaced 6 past applicants',
    meta: 'Talent rediscovery · Frontend Engineer',
    time: '2h ago',
    color: '#8B7DD8',
  },
  {
    id: 'l5',
    title: 'Sent reminder to 3 interviewers',
    meta: 'Interview scheduling · overdue scorecards',
    time: '3h ago',
    color: '#4C6EF5',
  },
];

function CriterionIcon({ met }: { met: Criterion['met'] }) {
  if (met === 'yes')
    return <Check className="h-3 w-3 text-green-600 dark:text-green-400" />;
  if (met === 'partial')
    return <Minus className="h-3 w-3 text-amber-600 dark:text-amber-400" />;
  return <X className="h-3 w-3 text-red-600 dark:text-red-400" />;
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <div
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-sm font-semibold tabular-nums',
        score >= 75
          ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400'
          : score >= 55
            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
            : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
      )}
    >
      {score}
    </div>
  );
}

export default function AgentsPage() {
  const router = useRouter();
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(AGENTS.map((a) => [a.id, a.enabled])),
  );
  const [filter, setFilter] = useState<
    'all' | 'Advance' | 'Review' | 'Decline'
  >('all');
  const [decided, setDecided] = useState<
    Record<string, 'accepted' | 'overridden'>
  >({});

  const stored = useStoredAgents();
  const customAgents: Agent[] = stored.map((a) => ({
    id: a.id,
    href: `/dashboard/agents/new?agent=${a.id}`,
    status: a.status === 'Draft' ? 'Draft' : 'New',
    custom: true,
    name: a.config.name || 'Untitled agent',
    description: a.config.description || 'No description',
    icon: TRIGGERS.find((t) => t.id === a.config.trigger)?.icon ?? FileSearch,
    trigger: triggerSentence(a.config),
    enabled: a.enabled,
    scope:
      a.config.jobScope === 'all'
        ? 'All roles'
        : `${a.config.jobs.length} roles`,
    runs: 0,
    agreement:
      a.status === 'Draft'
        ? 'Draft, not running yet'
        : 'Waiting for the first event',
    lastRun: a.status === 'Draft' ? 'Never' : 'Just now',
  }));
  const allAgents = [...customAgents, ...AGENTS];
  const isEnabled = (a: Agent) => (a.custom ? a.enabled : enabled[a.id]);
  const toggleAgent = (a: Agent, v: boolean) =>
    a.custom
      ? setAgentEnabled(a.id, v)
      : setEnabled((s) => ({ ...s, [a.id]: v }));

  const queue = QUEUE.filter((r) => filter === 'all' || r.verdict === filter);
  const pending = QUEUE.filter((r) => !decided[r.id]).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">Agents</h1>
            <NotIntegratedBadge />
          </div>
          <p className="text-xs text-muted-foreground">
            {allAgents.filter(isEnabled).length} active · 316 actions this week
            · 91% accepted by recruiters
          </p>
        </div>
        <ToolbarButton
          variant="primary"
          icon={Plus}
          onClick={() => router.push('/dashboard/agents/new')}
        >
          New agent
        </ToolbarButton>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {allAgents.map((a) => (
          <div
            key={a.id}
            role="link"
            tabIndex={0}
            onClick={() => router.push(a.href)}
            onKeyDown={(e) => e.key === 'Enter' && router.push(a.href)}
            className="group flex cursor-pointer flex-col rounded-lg border border-border bg-card p-4 transition-colors hover:border-[#3F6650]/50 dark:hover:border-[#8FBFA1]/50"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-muted/50">
                  <a.icon className="h-4 w-4 text-muted-foreground" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-semibold">{a.name}</p>
                    {a.status && (
                      <StatusPill
                        tone={a.status === 'Draft' ? 'neutral' : 'success'}
                      >
                        {a.status}
                      </StatusPill>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{a.scope}</p>
                </div>
              </div>
              <div
                className="flex shrink-0 items-center gap-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                {a.custom && (
                  <button
                    type="button"
                    aria-label="Delete agent"
                    onClick={() => deleteAgent(a.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-red-600 group-hover:opacity-100 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <Switch
                  checked={isEnabled(a)}
                  onCheckedChange={(v) => toggleAgent(a, v)}
                />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 rounded border border-border bg-muted/40 px-2 py-1 text-xs">
              <Zap className="h-3 w-3 shrink-0 text-[#3F6650] dark:text-[#8FBFA1]" />
              <span className="truncate">{a.trigger}</span>
            </div>
            <p className="mt-2 flex-1 text-xs leading-relaxed text-muted-foreground">
              {a.description}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3 text-xs">
              <div>
                <p className="text-muted-foreground">Runs this week</p>
                <p className="font-medium tabular-nums">
                  {isEnabled(a) ? a.runs : 0}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Last run</p>
                <p className="font-medium">
                  {isEnabled(a)
                    ? a.lastRun
                    : a.status === 'Draft'
                      ? 'Never'
                      : 'Paused'}
                </p>
              </div>
              <p className="col-span-2 text-muted-foreground">
                {isEnabled(a) || a.custom
                  ? a.agreement
                  : 'Turn on to start running'}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Start from a template
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          {Object.entries(TEMPLATES).map(([key, t]) => (
            <Link
              key={key}
              href={`/dashboard/agents/new?template=${key}`}
              className="group flex items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-card px-4 py-3 hover:border-[#3F6650] hover:bg-[#EDF1EE]/50 dark:hover:border-[#8FBFA1] dark:hover:bg-[#3F6650]/10"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{t.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {t.description}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <SectionCard
          icon={ListChecks}
          title="Screening review queue"
          subtitle={`${pending} recommendations waiting for a recruiter decision`}
          bodyClassName="p-0"
          actions={
            <SegmentedControl
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: 'All' },
                { value: 'Advance', label: 'Advance' },
                { value: 'Review', label: 'Review' },
                { value: 'Decline', label: 'Decline' },
              ]}
            />
          }
        >
          <ul className="divide-y divide-border">
            {queue.map((r) => (
              <li
                key={r.id}
                className={cn(
                  'flex gap-4 px-4 py-4',
                  decided[r.id] && 'opacity-60',
                )}
              >
                <ScoreBadge score={r.score} />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <InitialsAvatar
                      name={r.candidate}
                      className="h-5 w-5 text-[9px]"
                    />
                    <span className="text-sm font-semibold">{r.candidate}</span>
                    <span className="text-xs text-muted-foreground">
                      {r.role} · {r.source}
                    </span>
                    <StatusPill tone={VERDICT_TONE[r.verdict]}>
                      Suggests {r.verdict.toLowerCase()}
                    </StatusPill>
                  </div>
                  <p className="text-sm text-muted-foreground">{r.summary}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {r.criteria.map((c) => (
                      <span
                        key={c.label}
                        className="inline-flex items-center gap-1 rounded border border-border px-1.5 py-0.5 text-xs"
                      >
                        <CriterionIcon met={c.met} />
                        {c.label}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  {decided[r.id] ? (
                    <span className="text-xs font-medium text-muted-foreground">
                      {decided[r.id] === 'accepted' ? 'Accepted' : 'Overridden'}
                    </span>
                  ) : (
                    <>
                      <ToolbarButton
                        variant="primary"
                        onClick={() =>
                          setDecided((s) => ({ ...s, [r.id]: 'accepted' }))
                        }
                      >
                        {r.verdict === 'Decline'
                          ? 'Decline'
                          : r.verdict === 'Review'
                            ? 'Phone screen'
                            : 'Advance'}
                      </ToolbarButton>
                      <ToolbarButton
                        variant="ghost"
                        onClick={() =>
                          setDecided((s) => ({ ...s, [r.id]: 'overridden' }))
                        }
                      >
                        Override
                      </ToolbarButton>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>

        <div className="space-y-4">
          <SectionCard
            icon={History}
            title="Agent activity"
            bodyClassName="p-4"
          >
            <Timeline entries={LOG} />
          </SectionCard>
          <SectionCard
            icon={Settings2}
            title="Guardrails"
            bodyClassName="space-y-2.5 p-4 text-sm"
          >
            {[
              ['Recruiter approval before rejection', true],
              ['Hide name, photo and age while scoring', true],
              ['Auto-send booking links', true],
              ['Auto-advance scores above 90', false],
            ].map(([label, on]) => (
              <div
                key={label as string}
                className="flex items-center justify-between gap-3"
              >
                <span className="text-muted-foreground">{label}</span>
                <Switch defaultChecked={on as boolean} />
              </div>
            ))}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
