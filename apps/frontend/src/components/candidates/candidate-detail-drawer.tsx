'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Mail,
  CalendarDays,
  MoreHorizontal,
  Sparkles,
  Globe,
  Check,
  X,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  LinkedInIcon,
  GithubIcon,
  TwitterIcon,
  GitLabIcon,
  StackOverflowIcon,
  MediumIcon,
  DribbbleIcon,
  BehanceIcon,
  KaggleIcon,
  DevToIcon,
} from '@/components/icons/brand-icons';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { InitialsAvatar } from '@/components/ui/initials-avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  StatusPill,
  RatingStars,
  StageProgress,
  Timeline,
  Scorecard,
  MetricRing,
  ToolbarButton,
  EmptyState,
  NotIntegratedBadge,
} from '@/components/patterns';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { usePermissions } from '@/hooks/use-permissions';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';
import {
  useCandidateQuery,
  useDeleteCandidateMutation,
  useUpdateCandidateMutation,
} from '@/hooks/queries';
import type {
  CandidateApplicationSummary,
  CandidateDetail,
  UpdateCandidateRequest,
} from '@/types/candidate.type';
import {
  RIGHT_TO_WORK_LABEL,
  RIGHT_TO_WORK_TONE,
  SOURCE_LABEL,
  daysSince,
  errorMessage,
  usePipelineStageMeta,
  userLabel,
} from '@/components/applications/application-meta';
import { StagePill } from '@/components/applications/stage-pill';
import { useFormatters } from '@/hooks/use-formatters';
import { useCustomFieldsQuery } from '@/hooks/queries';
import { CustomFieldsView } from '@/components/custom-fields/custom-fields-view';
import { SendEmailDialog } from '@/components/applications/send-email-dialog';
import { AddToJobDialog } from '@/components/applications/add-to-job-dialog';
import { AddCandidateDrawer } from './add-candidate-drawer';
import { CandidateApplicationsTab } from './candidate-applications-tab';
import {
  CandidateActivityTab,
  toTimelineEntry,
  useCandidateActivities,
} from './candidate-activity-tab';
import { CandidateDocumentsTab } from './candidate-documents-tab';
import { CandidateTasksTab } from './candidate-tasks-tab';
import { CandidateInterviewsTab } from './candidate-interviews-tab';
import { ScheduleInterviewDrawer } from '@/components/interviews/schedule-interview-drawer';
import { InterviewDetailDrawer } from '@/components/interviews/interview-detail-drawer';
import type { Interview } from '@/types/interview.type';

const SAMPLE_LINKS: { label: string; icon: ReactNode }[] = [
  { label: 'GitHub', icon: <GithubIcon className="h-4 w-4 shrink-0" /> },
  { label: 'GitLab', icon: <GitLabIcon className="h-4 w-4 shrink-0" /> },
  {
    label: 'Portfolio',
    icon: <Globe className="h-4 w-4 shrink-0 text-[#3F6650]" />,
  },
  {
    label: 'Stack Overflow',
    icon: <StackOverflowIcon className="h-4 w-4 shrink-0" />,
  },
  { label: 'Twitter', icon: <TwitterIcon className="h-4 w-4 shrink-0" /> },
  { label: 'Dribbble', icon: <DribbbleIcon className="h-4 w-4 shrink-0" /> },
  { label: 'Behance', icon: <BehanceIcon className="h-4 w-4 shrink-0" /> },
  { label: 'Medium', icon: <MediumIcon className="h-4 w-4 shrink-0" /> },
  { label: 'Dev.to', icon: <DevToIcon className="h-4 w-4 shrink-0" /> },
  { label: 'Kaggle', icon: <KaggleIcon className="h-4 w-4 shrink-0" /> },
];

const TAB_CLS =
  'rounded-none border-b-2 border-transparent bg-transparent px-0 pb-2.5 pt-3 text-sm font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:border-[#3F6650] data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none';

const PHONE = /^\+?\d{6,15}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AMOUNT = /^\d+(\.\d{1,2})?$/;
const cleanAmount = (v: string) => v.replace(/[^\d.]/g, '');

function InlineField({
  label,
  value,
  display,
  onSave,
}: {
  label: string;
  value: string;
  display?: string;
  onSave?: (value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() !== value) onSave?.(draft.trim());
  };

  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') {
              setDraft(value);
              setEditing(false);
            }
          }}
          className="h-7 w-40 rounded-sm border border-input bg-background px-2 text-right text-sm outline-none focus:ring-1 focus:ring-ring"
        />
      ) : (
        <button
          type="button"
          disabled={!onSave}
          onClick={() => setEditing(true)}
          className={cn(
            'truncate rounded-sm px-1 text-right text-sm',
            onSave && 'hover:bg-accent',
            !value && 'text-muted-foreground',
          )}
        >
          {display ?? value ?? ''}
          {!value && !display && (onSave ? 'Add' : '-')}
        </button>
      )}
    </div>
  );
}

function ReadField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="truncate px-1 text-right text-sm">{children}</span>
    </div>
  );
}

function Chips({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0)
    return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((s) => (
        <span
          key={s}
          className="rounded-sm bg-zinc-100 px-1.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
        >
          {s}
        </span>
      ))}
    </div>
  );
}

function DrawerSkeleton() {
  return (
    <div className="flex min-h-0 flex-1">
      <aside className="w-[280px] shrink-0 space-y-3 border-r border-border p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-5 w-full" />
        ))}
      </aside>
      <div className="flex-1 space-y-4 p-5">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}

function OverviewTab({
  c,
  focused,
}: {
  c: CandidateDetail;
  focused: CandidateApplicationSummary | null;
}) {
  const { data: activities } = useCandidateActivities(c.id);
  const recent = (activities?.data ?? []).slice(0, 3);
  const { flowStages } = usePipelineStageMeta();
  const fmt = useFormatters();
  const { data: fieldDefs = [] } = useCustomFieldsQuery({
    entity: 'candidate',
    activeOnly: true,
  });
  const flowIndex = focused
    ? flowStages.findIndex((s) => s.key === focused.stage)
    : -1;
  const role = c.currentTitle ?? focused?.jobTitle ?? 'candidate';

  return (
    <>
      {focused && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {focused.jobTitle}
            {focused.clientName ? `, ${focused.clientName}` : ''}
          </p>
          {flowIndex >= 0 ? (
            <StageProgress
              stages={flowStages.map((s) => ({ label: s.name }))}
              currentIndex={flowIndex}
            />
          ) : (
            <StagePill stage={focused.stage} />
          )}
        </div>
      )}
      <div className="rounded-md border border-border p-4">
        <div className="mb-1 flex items-center gap-1.5 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-[#3F6650]" />
          AI summary
          <NotIntegratedBadge />
        </div>
        <p className="text-sm text-muted-foreground">
          Strong {role.toLowerCase()} with {c.yearsExperience ?? 0} years of
          experience, sourced via {SOURCE_LABEL[c.source]}. Skills align well
          with the role; recommend advancing to the next stage
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm font-medium">Headline</p>
          <p className="text-sm text-muted-foreground">
            {c.headline || 'No headline yet'}
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Experience</p>
          <p className="text-sm text-muted-foreground">
            {[
              c.currentTitle,
              c.currentEmployer,
              c.yearsExperience !== null ? `${c.yearsExperience} yrs` : null,
            ]
              .filter(Boolean)
              .join(' · ') || 'Not recorded'}
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Skills</p>
          <Chips items={c.skills} empty="No skills added" />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Tags</p>
          <Chips items={c.tags} empty="No tags" />
        </div>
      </div>
      {fieldDefs.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">Additional details</p>
          <CustomFieldsView fields={fieldDefs} values={c.customFields} />
        </div>
      )}
      <div>
        <p className="mb-2 text-sm font-medium">Recent activity</p>
        {recent.length ? (
          <Timeline
            entries={recent.map((a) => toTimelineEntry(a, fmt, false))}
          />
        ) : (
          <p className="text-sm text-muted-foreground">No activity yet</p>
        )}
      </div>
    </>
  );
}

function AiInsightsTab({ c }: { c: CandidateDetail }) {
  const rating = c.rating ?? 3;
  const role = c.currentTitle ?? 'this role';
  return (
    <>
      <div className="flex items-center gap-2 text-sm font-medium">
        AI evaluation
        <NotIntegratedBadge />
      </div>
      <div className="flex items-center gap-6 rounded-md border border-border p-4">
        <MetricRing value={78} label="Match" />
        <div className="flex-1 text-sm text-muted-foreground">
          Overall a strong match for {role}. Based on resume parsing and
          screening answers
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-medium text-green-700 dark:text-green-400">
            Strengths
          </p>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <Check className="mt-0.5 h-3.5 w-3.5 text-green-600 dark:text-green-400" />
              {c.yearsExperience ?? 0}+ years relevant experience
            </li>
            <li className="flex gap-2">
              <Check className="mt-0.5 h-3.5 w-3.5 text-green-600 dark:text-green-400" />
              Strong core skills for the role
            </li>
            <li className="flex gap-2">
              <Check className="mt-0.5 h-3.5 w-3.5 text-green-600 dark:text-green-400" />
              Clear communication in screening
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-amber-700 dark:text-amber-400">
            Flags
          </p>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <X className="mt-0.5 h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              Gap in employment 2023-2024
            </li>
            <li className="flex gap-2">
              <X className="mt-0.5 h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              Location may need relocation
            </li>
          </ul>
        </div>
      </div>
      <div className="max-w-md">
        <Scorecard
          criteria={[
            { label: 'Technical skills', rating: Math.min(5, rating + 1) },
            { label: 'Communication', rating },
            { label: 'Culture fit', rating: Math.max(1, rating - 1) },
          ]}
        />
      </div>
    </>
  );
}

export function CandidateDetailDrawer({
  candidateId,
  applicationId,
  open,
  onOpenChange,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: {
  candidateId: string | null;
  applicationId?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}) {
  const {
    data: c,
    isLoading,
    isError,
  } = useCandidateQuery(open ? candidateId : null);
  const updateCandidate = useUpdateCandidateMutation();
  const deleteCandidate = useDeleteCandidateMutation();
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission(PERMISSIONS_ENUM.CANDIDATE_UPDATE);
  const fmt = useFormatters();

  const [tab, setTab] = useState('overview');
  const [editOpen, setEditOpen] = useState(false);
  const [addToJobOpen, setAddToJobOpen] = useState(false);
  const [emailApp, setEmailApp] = useState<CandidateApplicationSummary | null>(
    null,
  );
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleAppId, setScheduleAppId] = useState<string | null>(null);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(
    null,
  );
  const [interviewId, setInterviewId] = useState<string | null>(null);

  const openSchedule = (app: CandidateApplicationSummary) => {
    setEditingInterview(null);
    setScheduleAppId(app.id);
    setScheduleOpen(true);
  };

  const editInterview = (interview: Interview) => {
    setInterviewId(null);
    setEditingInterview(interview);
    setScheduleAppId(null);
    setScheduleOpen(true);
  };

  useEffect(() => {
    setTab(applicationId ? 'applications' : 'overview');
  }, [candidateId, applicationId]);

  const focused =
    c?.applications.find((a) => a.id === applicationId) ??
    [...(c?.applications ?? [])].sort(
      (a, b) =>
        new Date(b.stageChangedAt).getTime() -
        new Date(a.stageChangedAt).getTime(),
    )[0] ??
    null;

  const name = c ? `${c.firstName} ${c.lastName}` : '';

  const save = (data: UpdateCandidateRequest) => {
    if (!c) return;
    updateCandidate.mutate(
      { id: c.id, data },
      {
        onSuccess: () => toast.success('Saved'),
        onError: (err) => toast.error('Could not save', errorMessage(err)),
      },
    );
  };

  const saveIf =
    (
      validate: (v: string) => boolean,
      message: string,
      build: (v: string) => UpdateCandidateRequest,
    ) =>
    (v: string) => {
      if (v && !validate(v)) {
        toast.error(message);
        return;
      }
      save(build(v));
    };

  const editable = <T,>(fn: T) => (canEdit ? fn : undefined);

  const confirmDelete = async () => {
    if (!c) return;
    try {
      await deleteCandidate.mutateAsync(c.id);
      toast.success(`${name} deleted`);
      setDeleteOpen(false);
      onOpenChange(false);
    } catch (err) {
      toast.error('Could not delete candidate', errorMessage(err));
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        hideClose
        className="flex w-full flex-col gap-0 overflow-visible bg-background p-0 sm:max-w-[min(1440px,97vw)]"
      >
        <SheetTitle className="sr-only">{name || 'Candidate'}</SheetTitle>

        <div className="absolute left-0 top-4 z-50 flex -translate-x-[calc(100%+8px)] flex-col overflow-hidden rounded-md border border-border bg-background shadow-md">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="h-px bg-border" />
          <button
            type="button"
            onClick={onPrev}
            disabled={!hasPrev}
            aria-label="Previous candidate"
            className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!hasNext}
            aria-label="Next candidate"
            className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-1 border-b border-border px-4 py-2.5">
          <span className="text-sm font-medium">{name}</span>
          {focused && <StagePill stage={focused.stage} className="ml-2" />}
          {c && (
            <span className="ml-auto flex items-center gap-1.5">
              <PermissionGuard
                permissions={PERMISSIONS_ENUM.EMAIL_TEMPLATE_SEND}
              >
                <ToolbarButton
                  icon={Mail}
                  disabled={!focused}
                  title={focused ? undefined : 'Add to a job to send email'}
                  onClick={() => focused && setEmailApp(focused)}
                >
                  Email
                </ToolbarButton>
              </PermissionGuard>
              <PermissionGuard
                permissions={PERMISSIONS_ENUM.APPLICATION_CREATE}
              >
                <ToolbarButton
                  icon={Plus}
                  onClick={() => setAddToJobOpen(true)}
                >
                  Add to job
                </ToolbarButton>
              </PermissionGuard>
              <PermissionGuard permissions={PERMISSIONS_ENUM.CANDIDATE_UPDATE}>
                <ToolbarButton icon={Pencil} onClick={() => setEditOpen(true)}>
                  Edit
                </ToolbarButton>
              </PermissionGuard>
              <PermissionGuard permissions={PERMISSIONS_ENUM.INTERVIEW_CREATE}>
                <ToolbarButton
                  icon={CalendarDays}
                  disabled={!focused}
                  title={focused ? undefined : 'Add to a job to schedule'}
                  onClick={() => focused && openSchedule(focused)}
                >
                  Schedule
                </ToolbarButton>
              </PermissionGuard>
              <PermissionGuard permissions={PERMISSIONS_ENUM.CANDIDATE_DELETE}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <ToolbarButton icon={MoreHorizontal} aria-label="More" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onSelect={() => setDeleteOpen(true)}
                      className="text-red-600 focus:text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete candidate
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </PermissionGuard>
            </span>
          )}
        </div>

        {isLoading && <DrawerSkeleton />}

        {!isLoading && (isError || !c) && (
          <EmptyState
            title={
              isError ? 'Could not load candidate' : 'No candidate selected'
            }
            className="flex-1"
          />
        )}

        {c && (
          <div className="flex min-h-0 flex-1">
            <aside className="w-[280px] shrink-0 overflow-y-auto border-r border-border p-4">
              <div className="flex items-center gap-3">
                <InitialsAvatar name={name} className="h-12 w-12 text-sm" />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {[c.currentTitle, c.currentEmployer]
                      .filter(Boolean)
                      .join(' at ') || 'No current role'}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <StatusPill tone={RIGHT_TO_WORK_TONE[c.rightToWork]}>
                  {RIGHT_TO_WORK_LABEL[c.rightToWork]}
                </StatusPill>
                <RatingStars
                  value={c.rating ?? 0}
                  onChange={editable((v: number) =>
                    save({ rating: v || null }),
                  )}
                />
              </div>

              <div className="mt-4 space-y-0.5 border-t border-border pt-2">
                <InlineField
                  label="Email"
                  value={c.email}
                  onSave={editable(
                    saveIf(
                      (v) => EMAIL.test(v),
                      'Enter a valid email',
                      (v) => (v ? { email: v } : {}),
                    ),
                  )}
                />
                <InlineField
                  label="Phone"
                  value={c.phone ?? ''}
                  onSave={editable(
                    saveIf(
                      (v) => PHONE.test(v.replace(/[\s().-]/g, '')),
                      'Enter a valid phone number',
                      (v) => ({ phone: v ? v.replace(/[\s().-]/g, '') : null }),
                    ),
                  )}
                />
                <InlineField
                  label="Location"
                  value={c.location ?? ''}
                  onSave={editable((v: string) =>
                    save({ location: v || null }),
                  )}
                />
                <InlineField
                  label="Title"
                  value={c.currentTitle ?? ''}
                  onSave={editable((v: string) =>
                    save({ currentTitle: v || null }),
                  )}
                />
                <InlineField
                  label="Employer"
                  value={c.currentEmployer ?? ''}
                  onSave={editable((v: string) =>
                    save({ currentEmployer: v || null }),
                  )}
                />
                <InlineField
                  label="Notice"
                  value={c.noticePeriod ?? ''}
                  onSave={editable((v: string) =>
                    save({ noticePeriod: v || null }),
                  )}
                />
                <InlineField
                  label="Expected salary"
                  value={
                    c.expectedSalary !== null ? String(c.expectedSalary) : ''
                  }
                  display={
                    c.expectedSalary !== null
                      ? fmt.money(c.expectedSalary)
                      : undefined
                  }
                  onSave={editable(
                    saveIf(
                      (v) => AMOUNT.test(cleanAmount(v)),
                      `Enter an amount in ${fmt.currency}`,
                      (v) => ({
                        expectedSalary: v ? Number(cleanAmount(v)) : null,
                      }),
                    ),
                  )}
                />
                <ReadField label="Source">{SOURCE_LABEL[c.source]}</ReadField>
                <ReadField label="Owner">{userLabel(c.owner) || '-'}</ReadField>
                <ReadField label="Added">{fmt.date(c.createdAt)}</ReadField>
                {focused && (
                  <ReadField label="In stage">
                    {daysSince(focused.stageChangedAt)}d
                  </ReadField>
                )}
              </div>

              <div className="mt-3 border-t border-border pt-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Links
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {c.linkedinUrl ? (
                    <a
                      href={c.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 truncate rounded-sm px-1.5 py-1.5 text-sm hover:bg-accent"
                    >
                      <LinkedInIcon className="h-4 w-4 shrink-0" />
                      <span className="truncate">LinkedIn</span>
                    </a>
                  ) : (
                    <span className="flex items-center gap-2 truncate px-1.5 py-1.5 text-sm text-muted-foreground">
                      <LinkedInIcon className="h-4 w-4 shrink-0 opacity-50" />
                      <span className="truncate">No LinkedIn</span>
                    </span>
                  )}
                  <a
                    href={`mailto:${c.email}`}
                    className="flex items-center gap-2 truncate rounded-sm px-1.5 py-1.5 text-sm hover:bg-accent"
                  >
                    <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">Email</span>
                  </a>
                </div>
                <div className="mb-1 mt-3 flex items-center gap-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Other profiles
                  </p>
                  <NotIntegratedBadge />
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {SAMPLE_LINKS.map((link) => (
                    <a
                      key={link.label}
                      href="#"
                      className="flex items-center gap-2 truncate rounded-sm px-1.5 py-1.5 text-sm hover:bg-accent"
                    >
                      {link.icon}
                      <span className="truncate">{link.label}</span>
                    </a>
                  ))}
                </div>
              </div>
            </aside>

            <div className="min-w-0 flex-1 overflow-y-auto">
              <Tabs
                value={tab}
                onValueChange={setTab}
                className="flex h-full flex-col"
              >
                <TabsList className="sticky top-0 z-10 h-auto w-full justify-start gap-5 rounded-none border-b border-border bg-background px-4 py-0">
                  <TabsTrigger value="overview" className={TAB_CLS}>
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="applications" className={TAB_CLS}>
                    Applications ({c.applications.length})
                  </TabsTrigger>
                  <PermissionGuard
                    permissions={PERMISSIONS_ENUM.INTERVIEW_LIST_READ}
                  >
                    <TabsTrigger value="interviews" className={TAB_CLS}>
                      Interviews
                    </TabsTrigger>
                  </PermissionGuard>
                  <TabsTrigger value="documents" className={TAB_CLS}>
                    Documents
                  </TabsTrigger>
                  <TabsTrigger value="activity" className={TAB_CLS}>
                    Notes and activity
                  </TabsTrigger>
                  <TabsTrigger value="tasks" className={TAB_CLS}>
                    Tasks
                  </TabsTrigger>
                  <TabsTrigger value="ai" className={TAB_CLS}>
                    AI insights
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-0 space-y-5 p-5">
                  <OverviewTab c={c} focused={focused} />
                </TabsContent>

                <TabsContent value="applications" className="mt-0 p-5">
                  <CandidateApplicationsTab
                    candidate={c}
                    focusedApplicationId={applicationId}
                    onEmail={setEmailApp}
                    onAddToJob={() => setAddToJobOpen(true)}
                    onSchedule={openSchedule}
                  />
                </TabsContent>

                <TabsContent value="interviews" className="mt-0 p-5">
                  <CandidateInterviewsTab
                    candidate={c}
                    onOpen={setInterviewId}
                    onSchedule={openSchedule}
                  />
                </TabsContent>

                <TabsContent value="documents" className="mt-0 p-0">
                  <PermissionGuard
                    permissions={PERMISSIONS_ENUM.DOCUMENT_READ}
                    fallback={
                      <EmptyState
                        className="p-5"
                        title="You do not have access to documents"
                      />
                    }
                  >
                    <CandidateDocumentsTab candidateId={c.id} />
                  </PermissionGuard>
                </TabsContent>

                <TabsContent value="activity" className="mt-0 p-5">
                  <CandidateActivityTab candidateId={c.id} />
                </TabsContent>

                <TabsContent value="tasks" className="mt-0 p-5">
                  <CandidateTasksTab candidate={c} />
                </TabsContent>

                <TabsContent value="ai" className="mt-0 space-y-5 p-5">
                  <AiInsightsTab c={c} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}

        <ScheduleInterviewDrawer
          open={scheduleOpen}
          onOpenChange={(o) => {
            setScheduleOpen(o);
            if (!o) setEditingInterview(null);
          }}
          interview={editingInterview}
          applicationId={scheduleAppId}
        />
        <InterviewDetailDrawer
          interviewId={interviewId}
          open={interviewId !== null}
          onOpenChange={(o) => !o && setInterviewId(null)}
          onEdit={editInterview}
        />
        <AddCandidateDrawer
          open={editOpen}
          onOpenChange={setEditOpen}
          candidate={c ?? null}
        />
        {c && (
          <AddToJobDialog
            open={addToJobOpen}
            onOpenChange={setAddToJobOpen}
            candidateId={c.id}
            candidateName={name}
            excludeJobIds={c.applications.map((a) => a.jobId)}
          />
        )}
        <SendEmailDialog
          open={emailApp !== null}
          onOpenChange={(o) => !o && setEmailApp(null)}
          recipient={
            c && emailApp
              ? {
                  applicationId: emailApp.id,
                  jobId: emailApp.jobId,
                  jobTitle: emailApp.jobTitle,
                  jobReference: emailApp.jobReference,
                  clientName: emailApp.clientName,
                  candidate: {
                    firstName: c.firstName,
                    lastName: c.lastName,
                    email: c.email,
                  },
                }
              : null
          }
        />
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {name}?</AlertDialogTitle>
              <AlertDialogDescription>
                Their applications, notes and documents are removed too. This
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}
