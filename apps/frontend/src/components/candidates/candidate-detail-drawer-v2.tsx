'use client';

import { useState, type ReactNode } from 'react';
import {
  ChevronUp,
  ChevronDown,
  X,
  Mail,
  CalendarDays,
  MoreHorizontal,
  Check,
  Sparkles,
  Wand2,
  Star,
  FileText,
  Download,
  ExternalLink,
  Briefcase,
  Globe,
  Send,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  StatusPill,
  RatingStars,
  Timeline,
  Scorecard,
  MetricRing,
  ToolbarButton,
  type PillTone,
  DrawerNavControls,
} from '@/components/patterns';
import { DocxViewer } from './docx-viewer';
import {
  LinkedInIcon,
  GithubIcon,
  StackOverflowIcon,
} from '@/components/icons/brand-icons';

interface CandidateDetail {
  id: string;
  name: string;
  role: string;
  stage: string;
  source: string;
  rating: number;
  experience: number;
  location: string;
  applied: string;
  email?: string;
  phone?: string;
}

const FLOW = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'];

const STAGE_TONE: Record<string, PillTone> = {
  Applied: 'neutral',
  Screening: 'info',
  Interview: 'warning',
  Offer: 'success',
  Rejected: 'danger',
  Hired: 'success',
};

const DOCS = [
  { name: 'Resume.pdf', url: '/sample-resume.pdf', type: 'pdf' as const },
  { name: 'Resume.docx', url: '/sample-resume.docx', type: 'docx' as const },
];

const TAB_CLS =
  'rounded-none border-b-2 border-transparent bg-transparent px-0 pb-2.5 pt-3 text-sm font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:border-[#3F6650] data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none';

function StageStepper({
  current,
  onChange,
}: {
  current: number;
  onChange: (stage: string) => void;
}) {
  return (
    <div className="flex items-stretch overflow-hidden rounded-md border border-border">
      {FLOW.map((stage, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <button
            key={stage}
            type="button"
            onClick={() => onChange(stage)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 border-r border-border px-2 py-2 text-[13px] font-medium transition-colors last:border-r-0',
              active
                ? 'bg-[#3F6650] text-white'
                : done
                  ? 'bg-[#EDF1EE] text-[#16201A] hover:bg-[#dfe8e2] dark:bg-[#3F6650]/20 dark:text-[#8FBFA1]'
                  : 'text-muted-foreground hover:bg-accent',
            )}
          >
            {done && <Check className="h-3.5 w-3.5" />}
            {stage}
          </button>
        );
      })}
    </div>
  );
}

function NextAction({
  icon,
  label,
  hint,
  action,
  onAction,
}: {
  icon: ReactNode;
  label: string;
  hint: string;
  action: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border px-3 py-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#EDF1EE] text-[#3F6650] dark:bg-[#3F6650]/20">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <ToolbarButton onClick={onAction}>{action}</ToolbarButton>
    </div>
  );
}

function EmailComposer({ to, onClose }: { to: string; onClose: () => void }) {
  return (
    <div className="rounded-md border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="flex items-center gap-1.5 text-sm font-medium">
          <Mail className="h-4 w-4 text-[#3F6650]" />
          New email
        </span>
        <button
          onClick={onClose}
          aria-label="Close"
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-2 p-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="w-14 text-muted-foreground">Template</span>
          <select className="h-8 flex-1 rounded-md border border-input bg-background px-2 text-sm">
            <option>None</option>
            <option>Intro / screen invite</option>
            <option>Interview invite</option>
            <option>Offer</option>
          </select>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="w-14 text-muted-foreground">To</span>
          <span className="flex-1 rounded-md border border-input bg-muted/40 px-2 py-1.5 text-sm">
            {to}
          </span>
        </div>
        <input
          defaultValue="Next steps in your application"
          className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
        />
        <Textarea
          rows={5}
          defaultValue={
            'Hi there,\n\nWe would love to move you forward. Here is a link to schedule the next round.\n\nBest'
          }
        />
        <div className="flex items-center justify-between">
          <ToolbarButton icon={Wand2}>Write with AI</ToolbarButton>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" onClick={onClose}>
              <Send className="mr-1.5 h-3.5 w-3.5" />
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CandidateDetailDrawerV2({
  candidate,
  open,
  onOpenChange,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  onUpdate,
}: {
  candidate: CandidateDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  onUpdate?: (id: string, patch: Partial<CandidateDetail>) => void;
}) {
  const c = candidate;
  const [tab, setTab] = useState('overview');
  const [composing, setComposing] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(DOCS[0].name);
  const activeDoc = DOCS.find((d) => d.name === selectedDoc) ?? DOCS[0];

  const flowIndex = c ? FLOW.indexOf(c.stage) : -1;
  const email = c
    ? (c.email ?? `${c.name.split(' ')[0].toLowerCase()}@example.com`)
    : '';

  const openEmail = () => {
    setTab('activity');
    setComposing(true);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        hideClose
        className="flex w-full flex-col gap-0 bg-background p-0 sm:max-w-[min(1280px,95vw)]"
      >
        <SheetTitle className="sr-only">{c?.name ?? 'Candidate'}</SheetTitle>

        {c && (
          <>
            <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold">{c.name}</span>
                  <StatusPill tone={STAGE_TONE[c.stage] ?? 'neutral'} dot>
                    {c.stage}
                  </StatusPill>
                </div>
                <p className="text-xs text-muted-foreground">
                  {c.role} · in stage 5d · applied {c.applied}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <ToolbarButton variant="primary">
                      Change stage
                      <ChevronDown className="h-3.5 w-3.5" />
                    </ToolbarButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {[...FLOW, 'Rejected'].map((s) => (
                      <DropdownMenuItem
                        key={s}
                        onSelect={() => onUpdate?.(c.id, { stage: s })}
                        className="justify-between gap-6"
                      >
                        {s}
                        {s === c.stage && (
                          <Check className="h-4 w-4 text-[#3F6650]" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <ToolbarButton icon={Mail} onClick={openEmail}>
                  Email
                </ToolbarButton>
                <ToolbarButton icon={CalendarDays}>Schedule</ToolbarButton>
                <ToolbarButton icon={MoreHorizontal} aria-label="More" />
                <span className="mx-1 h-5 w-px bg-border" />
                <DrawerNavControls
                  onClose={() => onOpenChange(false)}
                  onPrev={onPrev}
                  onNext={onNext}
                  hasPrev={hasPrev}
                  hasNext={hasNext}
                />
              </div>
            </div>

            <div className="flex min-h-0 flex-1">
              <aside className="w-[300px] shrink-0 overflow-y-auto border-r border-border p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-md bg-[#EDF1EE] text-sm font-semibold text-[#3F6650] dark:bg-[#3F6650]/20">
                    {c.name
                      .split(' ')
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join('')}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{c.name}</p>
                    <RatingStars
                      value={c.rating}
                      size={13}
                      onChange={(v) => onUpdate?.(c.id, { rating: v })}
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Email</span>
                    <span className="truncate">{email}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Phone</span>
                    <span>{c.phone ?? '+1 555 0100'}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Location</span>
                    <span>{c.location}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Experience</span>
                    <span>{c.experience} yrs</span>
                  </div>
                </div>

                <div className="mt-4 border-t border-border pt-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Considered for
                  </p>
                  <div className="space-y-1.5">
                    <button className="flex w-full items-center justify-between rounded-md border border-[#3F6650]/40 bg-[#EDF1EE] px-2.5 py-2 text-left text-sm dark:bg-[#3F6650]/15">
                      <span className="flex items-center gap-2">
                        <Briefcase className="h-3.5 w-3.5 text-[#3F6650]" />
                        {c.role}
                      </span>
                      <StatusPill tone={STAGE_TONE[c.stage] ?? 'neutral'}>
                        {c.stage}
                      </StatusPill>
                    </button>
                    <button className="flex w-full items-center justify-between rounded-md border border-border px-2.5 py-2 text-left text-sm hover:bg-accent">
                      <span className="flex items-center gap-2">
                        <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                        Senior {c.role}
                      </span>
                      <StatusPill tone="danger">Rejected</StatusPill>
                    </button>
                  </div>
                </div>

                <div className="mt-4 border-t border-border pt-3 text-sm">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Attribution
                  </p>
                  <div className="flex justify-between gap-2 py-0.5">
                    <span className="text-muted-foreground">Source</span>
                    <span>{c.source}</span>
                  </div>
                  <div className="flex justify-between gap-2 py-0.5">
                    <span className="text-muted-foreground">Credited to</span>
                    <span>Maddy S</span>
                  </div>
                </div>

                <div className="mt-4 border-t border-border pt-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Links
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    <a
                      href="#"
                      className="flex items-center gap-2 rounded-sm px-1.5 py-1.5 text-sm hover:bg-accent"
                    >
                      <LinkedInIcon className="h-4 w-4 shrink-0" />
                      LinkedIn
                    </a>
                    <a
                      href="#"
                      className="flex items-center gap-2 rounded-sm px-1.5 py-1.5 text-sm hover:bg-accent"
                    >
                      <GithubIcon className="h-4 w-4 shrink-0" />
                      GitHub
                    </a>
                    <a
                      href="#"
                      className="flex items-center gap-2 rounded-sm px-1.5 py-1.5 text-sm hover:bg-accent"
                    >
                      <StackOverflowIcon className="h-4 w-4 shrink-0" />
                      Stack
                    </a>
                    <a
                      href="#"
                      className="flex items-center gap-2 rounded-sm px-1.5 py-1.5 text-sm hover:bg-accent"
                    >
                      <Globe className="h-4 w-4 shrink-0 text-[#3F6650]" />
                      Portfolio
                    </a>
                  </div>
                </div>
              </aside>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="border-b border-border px-5 py-3">
                  {flowIndex >= 0 && (
                    <StageStepper
                      current={flowIndex}
                      onChange={(s) => onUpdate?.(c.id, { stage: s })}
                    />
                  )}
                </div>

                <Tabs
                  value={tab}
                  onValueChange={setTab}
                  className="flex min-h-0 flex-1 flex-col"
                >
                  <TabsList className="h-auto w-full justify-start gap-5 rounded-none border-b border-border bg-background px-5 py-0">
                    <TabsTrigger value="overview" className={TAB_CLS}>
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="activity" className={TAB_CLS}>
                      Activity
                    </TabsTrigger>
                    <TabsTrigger value="feedback" className={TAB_CLS}>
                      Feedback
                    </TabsTrigger>
                    <TabsTrigger value="documents" className={TAB_CLS}>
                      Documents
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent
                    value="overview"
                    className="mt-0 min-h-0 flex-1 space-y-5 overflow-y-auto p-5"
                  >
                    <div className="rounded-md border border-border p-4">
                      <div className="mb-1 flex items-center gap-1.5 text-sm font-medium">
                        <Sparkles className="h-4 w-4 text-[#3F6650]" />
                        AI summary
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Strong {c.role.toLowerCase()} with {c.experience} years
                        of experience, sourced via {c.source}. Skills align
                        well; recommend advancing to the next stage
                      </p>
                    </div>
                    <div>
                      <p className="mb-2 text-sm font-medium">Next actions</p>
                      <div className="space-y-2">
                        <NextAction
                          icon={<CalendarDays className="h-4 w-4" />}
                          label="Schedule recruiter screen"
                          hint="Needs to be scheduled"
                          action="Schedule"
                        />
                        <NextAction
                          icon={<Mail className="h-4 w-4" />}
                          label="Send intro email"
                          hint="Draft ready"
                          action="Email"
                          onAction={openEmail}
                        />
                        <NextAction
                          icon={<Star className="h-4 w-4" />}
                          label="Request panel feedback"
                          hint="2 of 3 submitted"
                          action="Request"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="activity"
                    className="mt-0 min-h-0 flex-1 space-y-4 overflow-y-auto p-5"
                  >
                    {composing ? (
                      <EmailComposer
                        to={email}
                        onClose={() => setComposing(false)}
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <ToolbarButton icon={MessageSquare}>
                          Add note
                        </ToolbarButton>
                        <ToolbarButton
                          icon={Mail}
                          onClick={() => setComposing(true)}
                        >
                          Email
                        </ToolbarButton>
                        <ToolbarButton icon={Check}>Log outreach</ToolbarButton>
                      </div>
                    )}
                    <Timeline
                      entries={[
                        {
                          id: 'a1',
                          icon: <Check className="h-3.5 w-3.5" />,
                          color: '#3F6650',
                          title: `Moved to ${c.stage}`,
                          time: '2h ago',
                          meta: 'by Recruiter',
                        },
                        {
                          id: 'a2',
                          icon: <Mail className="h-3.5 w-3.5" />,
                          title: 'Screening email sent',
                          time: 'Yesterday',
                          meta: 'Auto-sequence',
                        },
                        {
                          id: 'a3',
                          icon: <CalendarDays className="h-3.5 w-3.5" />,
                          title: 'Interview scheduled',
                          time: '2 days ago',
                          meta: 'Panel of 3',
                        },
                        {
                          id: 'a4',
                          icon: <Briefcase className="h-3.5 w-3.5" />,
                          title: `Applied for ${c.role}`,
                          time: c.applied,
                          meta: `via ${c.source}`,
                        },
                      ]}
                    />
                  </TabsContent>

                  <TabsContent
                    value="feedback"
                    className="mt-0 min-h-0 flex-1 space-y-4 overflow-y-auto p-5"
                  >
                    <div className="flex items-center gap-6 rounded-md border border-border p-4">
                      <MetricRing value={c.rating * 20} label="Overall" />
                      <div className="flex-1 text-sm text-muted-foreground">
                        2 of 3 reviewers submitted. Consensus leans advance
                      </div>
                    </div>
                    <div className="max-w-md">
                      <Scorecard
                        criteria={[
                          {
                            label: 'Technical skills',
                            rating: Math.min(5, c.rating + 1),
                          },
                          { label: 'Communication', rating: c.rating },
                          {
                            label: 'Culture fit',
                            rating: Math.max(1, c.rating - 1),
                          },
                        ]}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="documents"
                    className="mt-0 min-h-0 flex-1 p-0"
                  >
                    <div className="flex h-full">
                      <div className="w-48 shrink-0 space-y-1 overflow-y-auto border-r border-border p-3">
                        {DOCS.map((doc) => (
                          <button
                            key={doc.name}
                            type="button"
                            onClick={() => setSelectedDoc(doc.name)}
                            className={cn(
                              'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm',
                              selectedDoc === doc.name
                                ? 'bg-[#EDF1EE] font-medium dark:bg-[#3F6650]/20'
                                : 'hover:bg-accent',
                            )}
                          >
                            <FileText
                              className={cn(
                                'h-4 w-4 shrink-0',
                                doc.type === 'pdf'
                                  ? 'text-[#E0533D]'
                                  : 'text-[#2B6CB0]',
                              )}
                            />
                            <span className="truncate">{doc.name}</span>
                          </button>
                        ))}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-center justify-between border-b border-border px-3 py-2">
                          <span className="text-sm font-medium">
                            {activeDoc.name}
                          </span>
                          <div className="flex items-center gap-1">
                            <a
                              href={activeDoc.url}
                              download
                              aria-label="Download"
                              className="flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                            <a
                              href={activeDoc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Open"
                              className="flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </div>
                        </div>
                        <div className="min-h-0 flex-1">
                          {activeDoc.type === 'pdf' ? (
                            <object
                              data={`${activeDoc.url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                              type="application/pdf"
                              className="h-full w-full"
                            />
                          ) : (
                            <DocxViewer url={activeDoc.url} />
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
