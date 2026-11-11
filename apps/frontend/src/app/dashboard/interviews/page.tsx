'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BellRing,
  CalendarClock,
  CalendarPlus,
  CalendarX,
  ClipboardCheck,
  MapPin,
  NotebookPen,
  Users,
  Video,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { downloadCsv } from '@/lib/export-csv';
import { InitialsAvatar } from '@/components/ui/initials-avatar';
import {
  AvatarStack,
  DataGrid,
  DetailDrawer,
  DetailPanel,
  ExportButton,
  FilterBar,
  MultiFilter,
  NotIntegratedBadge,
  PanelSection,
  Scorecard,
  SearchInput,
  SegmentedControl,
  StatusPill,
  ToolbarButton,
  type DataGridColumn,
  type PillTone,
} from '@/components/patterns';
import {
  INITIAL_INTERVIEWS,
  OFFICE_ADDRESS,
  REC_TONE,
  STATUS_TONE,
  formatDay,
  type Interview,
} from '@/components/interviews/interview-data';
import {
  ScheduleInterviewDrawer,
  type ScheduleValues,
} from '@/components/interviews/schedule-interview-drawer';
import {
  ScorecardForm,
  type ScorecardSubmission,
} from '@/components/interviews/scorecard-form';

type View = 'upcoming' | 'feedback' | 'past';

const VIEW_FILTER: Record<View, (i: Interview) => boolean> = {
  upcoming: (i) => i.status === 'Scheduled',
  feedback: (i) => i.status === 'Feedback due',
  past: (i) => i.status === 'Completed' || i.status === 'Cancelled',
};

function CountBadge({ value, active }: { value: number; active: boolean }) {
  return (
    <span
      className={cn(
        'order-last rounded px-1.5 text-[11px] font-semibold tabular-nums',
        active ? 'bg-[#3F6650] text-white' : 'bg-muted text-muted-foreground',
      )}
    >
      {value}
    </span>
  );
}

function FormatCell({ format }: { format: Interview['format'] }) {
  const Icon = format === 'Video' ? Video : MapPin;
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {format === 'Video' ? 'Google Meet' : 'Office'}
    </span>
  );
}

function FeedbackCell({ row }: { row: Interview }) {
  if (row.status === 'Scheduled' || row.status === 'Cancelled') {
    return <span className="text-muted-foreground">-</span>;
  }
  const total = row.panel.length;
  const done = row.submitted >= total;
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-1.5 w-12 overflow-hidden rounded-sm bg-muted">
        <span
          className={cn('block h-full', done ? 'bg-[#3F6650]' : 'bg-amber-500')}
          style={{
            width: `${(Math.min(row.submitted, total) / total) * 100}%`,
          }}
        />
      </span>
      <span className="tabular-nums text-muted-foreground">
        {Math.min(row.submitted, total)}/{total}
      </span>
    </span>
  );
}

const columns: DataGridColumn<Interview>[] = [
  {
    key: 'candidate',
    header: 'Candidate',
    width: 200,
    render: (r) => (
      <span className="flex items-center gap-2">
        <InitialsAvatar name={r.candidate} className="h-6 w-6 text-[10px]" />
        <span className="font-medium">{r.candidate}</span>
      </span>
    ),
  },
  { key: 'role', header: 'Role', width: 200 },
  { key: 'stage', header: 'Interview', width: 150 },
  {
    key: 'date',
    header: 'When',
    width: 150,
    render: (r) => (
      <span className="tabular-nums">
        {formatDay(r.isoDate)}{' '}
        <span className="text-muted-foreground">· {r.time}</span>
      </span>
    ),
  },
  { key: 'duration', header: 'Length', width: 90, mono: true },
  {
    key: 'format',
    header: 'Location',
    width: 130,
    render: (r) => <FormatCell format={r.format} />,
  },
  {
    key: 'panel',
    header: 'Panel',
    width: 110,
    render: (r) => (
      <AvatarStack
        items={r.panel.map((name) => ({ name }))}
        max={3}
        size={22}
      />
    ),
  },
  {
    key: 'feedback',
    header: 'Scorecards',
    width: 120,
    render: (r) => <FeedbackCell row={r} />,
  },
  {
    key: 'status',
    header: 'Status',
    width: 130,
    render: (r) =>
      r.recommendation && r.status === 'Completed' ? (
        <StatusPill tone={REC_TONE[r.recommendation]}>
          {r.recommendation}
        </StatusPill>
      ) : (
        <StatusPill tone={STATUS_TONE[r.status]} dot>
          {r.status}
        </StatusPill>
      ),
  },
];

function sortByWhen(a: Interview, b: Interview) {
  return `${a.isoDate}${a.time}`.localeCompare(`${b.isoDate}${b.time}`);
}

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>(INITIAL_INTERVIEWS);
  const [view, setView] = useState<View>('upcoming');
  const [search, setSearch] = useState('');
  const [roles, setRoles] = useState<string[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Interview | null>(null);
  const [scoring, setScoring] = useState(false);

  const counts = useMemo(
    () => ({
      upcoming: interviews.filter(VIEW_FILTER.upcoming).length,
      feedback: interviews.filter(VIEW_FILTER.feedback).length,
      past: interviews.filter(VIEW_FILTER.past).length,
    }),
    [interviews],
  );

  const roleOptions = useMemo(
    () => Array.from(new Set(interviews.map((i) => i.role))).sort(),
    [interviews],
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = interviews
      .filter(VIEW_FILTER[view])
      .filter(
        (i) =>
          (!q ||
            i.candidate.toLowerCase().includes(q) ||
            i.role.toLowerCase().includes(q)) &&
          (roles.length === 0 || roles.includes(i.role)),
      );
    return view === 'upcoming'
      ? filtered.sort(sortByWhen)
      : filtered.sort((a, b) => sortByWhen(b, a));
  }, [interviews, view, search, roles]);

  const detail = interviews.find((i) => i.id === detailId) ?? null;

  const update = (id: string, patch: Partial<Interview>) =>
    setInterviews((list) =>
      list.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    );

  const toggleRole = (v: string) =>
    setRoles((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));

  const openSchedule = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openReschedule = (interview: Interview) => {
    setEditing(interview);
    setDetailId(null);
    setFormOpen(true);
  };

  const handleSchedule = (values: ScheduleValues) => {
    const patch = {
      candidate: values.candidate,
      role: values.role,
      stage: values.stage,
      isoDate: values.date,
      time: values.time,
      duration: values.duration,
      format: values.format,
      panel: values.panel,
      notes: values.notes,
    };
    if (editing) {
      update(editing.id, patch);
      toast.success(
        'Interview rescheduled',
        `${values.candidate} and the panel have been notified`,
      );
    } else {
      setInterviews((list) => [
        { id: `n${Date.now()}`, submitted: 0, status: 'Scheduled', ...patch },
        ...list,
      ]);
      setView('upcoming');
      toast.success(
        'Interview scheduled',
        `Invites sent to ${values.candidate} and ${values.panel.length} interviewer${values.panel.length > 1 ? 's' : ''}`,
      );
    }
    setEditing(null);
  };

  const joinCall = (interview: Interview) => {
    if (interview.format === 'Video') {
      window.open(
        'https://meet.google.com/new',
        '_blank',
        'noopener,noreferrer',
      );
    } else {
      toast.info('Onsite interview', OFFICE_ADDRESS);
    }
  };

  const cancelInterview = (interview: Interview) => {
    update(interview.id, { status: 'Cancelled' });
    toast.success(
      'Interview cancelled',
      `${interview.candidate} has been notified`,
    );
  };

  const sendReminder = (interview: Interview) => {
    const pending = interview.panel.slice(interview.submitted);
    toast.success(`Reminder sent to ${pending.join(', ')}`);
  };

  const submitScorecard = (
    interview: Interview,
    submission: ScorecardSubmission,
  ) => {
    const submitted = interview.submitted + 1;
    const complete = submitted >= interview.panel.length;
    update(interview.id, {
      submitted,
      ratings: submission.ratings,
      recommendation: submission.recommendation,
      status: complete ? 'Completed' : 'Feedback due',
    });
    setScoring(false);
    toast.success(
      'Scorecard submitted',
      complete
        ? 'All feedback is in, the interview is complete'
        : `${interview.panel.length - submitted} still to submit`,
    );
  };

  const handleExport = () => {
    downloadCsv(`interviews-${view}`, rows, [
      { header: 'Candidate', value: (r) => r.candidate },
      { header: 'Role', value: (r) => r.role },
      { header: 'Interview', value: (r) => r.stage },
      { header: 'Date', value: (r) => r.isoDate },
      { header: 'Time', value: (r) => r.time },
      { header: 'Length', value: (r) => r.duration },
      {
        header: 'Location',
        value: (r) => (r.format === 'Video' ? 'Google Meet' : 'Office'),
      },
      { header: 'Panel', value: (r) => r.panel.join('; ') },
      {
        header: 'Scorecards',
        value: (r) =>
          `${Math.min(r.submitted, r.panel.length)}/${r.panel.length}`,
      },
      { header: 'Status', value: (r) => r.status },
      { header: 'Recommendation', value: (r) => r.recommendation ?? '' },
    ]);
    toast.success(
      'Export ready',
      `${rows.length} interviews downloaded as CSV`,
    );
  };

  const pendingInterviewer = detail
    ? detail.panel[Math.min(detail.submitted, detail.panel.length - 1)]
    : '';

  return (
    <div className="-m-4 flex h-[calc(100vh-6rem)] flex-col gap-3 p-4">
      <FilterBar
        end={
          <>
            <NotIntegratedBadge />
            <ExportButton formats={['CSV']} onExport={handleExport} />
            <ToolbarButton
              variant="primary"
              icon={CalendarPlus}
              onClick={openSchedule}
            >
              Schedule interview
            </ToolbarButton>
          </>
        }
      >
        <SegmentedControl
          value={view}
          onChange={setView}
          options={[
            {
              value: 'upcoming',
              label: 'Upcoming',
              icon: (
                <CountBadge
                  value={counts.upcoming}
                  active={view === 'upcoming'}
                />
              ),
            },
            {
              value: 'feedback',
              label: 'Needs feedback',
              icon: (
                <CountBadge
                  value={counts.feedback}
                  active={view === 'feedback'}
                />
              ),
            },
            {
              value: 'past',
              label: 'Past',
              icon: <CountBadge value={counts.past} active={view === 'past'} />,
            },
          ]}
        />
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search candidate or role..."
        />
        <MultiFilter
          label="Role"
          selected={roles}
          onToggle={toggleRole}
          options={roleOptions.map((r) => ({ label: r, value: r }))}
        />
      </FilterBar>

      <div className="flex min-h-0 flex-1 flex-col">
        <DataGrid
          columns={columns}
          rows={rows}
          getRowId={(r) => r.id}
          onRowClick={(r) => {
            setScoring(false);
            setDetailId(r.id);
          }}
          pinFirstColumn
          maxHeight="100%"
          className="flex-1"
        />
        <div className="flex items-center justify-between border border-t-0 border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <span>
            Showing {rows.length} of {counts[view]}
          </span>
          {view === 'feedback' && (
            <span>Scorecards are due within 24 hours of the interview</span>
          )}
        </div>
      </div>

      <ScheduleInterviewDrawer
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        initial={editing}
        onSubmit={handleSchedule}
      />

      <DetailDrawer
        open={detail !== null}
        onOpenChange={(o) => {
          if (!o) {
            setDetailId(null);
            setScoring(false);
          }
        }}
        title={detail ? `${detail.stage} with ${detail.candidate}` : ''}
        chips={
          detail && (
            <StatusPill tone={STATUS_TONE[detail.status]} dot>
              {detail.status}
            </StatusPill>
          )
        }
        footer={
          detail && (
            <div className="flex flex-wrap justify-end gap-2">
              {detail.status === 'Scheduled' && (
                <>
                  <ToolbarButton
                    variant="ghost"
                    icon={CalendarX}
                    onClick={() => cancelInterview(detail)}
                  >
                    Cancel interview
                  </ToolbarButton>
                  <ToolbarButton
                    icon={CalendarClock}
                    onClick={() => openReschedule(detail)}
                  >
                    Reschedule
                  </ToolbarButton>
                  <ToolbarButton
                    variant="primary"
                    icon={detail.format === 'Video' ? Video : MapPin}
                    onClick={() => joinCall(detail)}
                  >
                    {detail.format === 'Video' ? 'Join call' : 'Get directions'}
                  </ToolbarButton>
                </>
              )}
              {detail.status === 'Feedback due' && !scoring && (
                <>
                  <ToolbarButton
                    icon={BellRing}
                    onClick={() => sendReminder(detail)}
                  >
                    Send reminder
                  </ToolbarButton>
                  <ToolbarButton
                    variant="primary"
                    icon={ClipboardCheck}
                    onClick={() => setScoring(true)}
                  >
                    Submit scorecard
                  </ToolbarButton>
                </>
              )}
              {(detail.status === 'Completed' ||
                detail.status === 'Cancelled') && (
                <Link href="/dashboard/candidates">
                  <ToolbarButton variant="primary">
                    Open candidate
                  </ToolbarButton>
                </Link>
              )}
            </div>
          )
        }
      >
        {detail && (
          <DetailPanel>
            <div className="flex items-center gap-3">
              <InitialsAvatar
                name={detail.candidate}
                className="h-10 w-10 text-sm"
              />
              <div>
                <p className="font-semibold">{detail.candidate}</p>
                <p className="text-sm text-muted-foreground">{detail.role}</p>
              </div>
            </div>

            <PanelSection
              icon={<CalendarClock className="h-4 w-4" />}
              title="Details"
            >
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-md border border-border p-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Date</dt>
                  <dd className="font-medium">
                    {formatDay(detail.isoDate)}, {detail.time}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Length</dt>
                  <dd className="font-medium">{detail.duration}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Location</dt>
                  <dd className="font-medium">
                    {detail.format === 'Video' ? 'Google Meet' : OFFICE_ADDRESS}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    Interview kit
                  </dt>
                  <dd className="font-medium">{detail.stage}</dd>
                </div>
              </dl>
            </PanelSection>

            {detail.notes && (
              <PanelSection
                icon={<NotebookPen className="h-4 w-4" />}
                title="Notes for the panel"
              >
                <p className="rounded-md border border-border p-3 text-sm text-muted-foreground">
                  {detail.notes}
                </p>
              </PanelSection>
            )}

            <PanelSection icon={<Users className="h-4 w-4" />} title="Panel">
              <ul className="divide-y divide-border rounded-md border border-border">
                {detail.panel.map((p, idx) => {
                  const label =
                    detail.status === 'Scheduled' ||
                    detail.status === 'Cancelled'
                      ? 'Invited'
                      : idx < detail.submitted
                        ? 'Submitted'
                        : 'Overdue';
                  const tone: PillTone =
                    label === 'Submitted'
                      ? 'success'
                      : label === 'Overdue'
                        ? 'warning'
                        : 'neutral';
                  return (
                    <li
                      key={p}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm"
                    >
                      <InitialsAvatar
                        name={p}
                        className="h-6 w-6 text-[10px]"
                      />
                      <span className="flex-1">{p}</span>
                      <StatusPill tone={tone}>{label}</StatusPill>
                    </li>
                  );
                })}
              </ul>
            </PanelSection>

            <PanelSection
              icon={<ClipboardCheck className="h-4 w-4" />}
              title="Scorecard"
            >
              {scoring && detail.status === 'Feedback due' ? (
                <ScorecardForm
                  interviewer={pendingInterviewer}
                  onCancel={() => setScoring(false)}
                  onSubmit={(s) => submitScorecard(detail, s)}
                />
              ) : detail.ratings ? (
                <div className="space-y-3">
                  {detail.recommendation && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {detail.status === 'Completed'
                          ? 'Recommendation'
                          : 'Latest recommendation'}
                      </span>
                      <StatusPill tone={REC_TONE[detail.recommendation]}>
                        {detail.recommendation}
                      </StatusPill>
                    </div>
                  )}
                  <Scorecard criteria={detail.ratings} />
                </div>
              ) : (
                <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
                  {detail.status === 'Feedback due'
                    ? 'Waiting on interviewer feedback'
                    : detail.status === 'Cancelled'
                      ? 'Interview was cancelled'
                      : 'Scorecard opens once the interview ends'}
                </p>
              )}
            </PanelSection>
          </DetailPanel>
        )}
      </DetailDrawer>
    </div>
  );
}
