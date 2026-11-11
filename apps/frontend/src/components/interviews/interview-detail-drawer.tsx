'use client';

import { useState } from 'react';
import {
  CalendarClock,
  CalendarX,
  CheckCircle2,
  ClipboardCheck,
  NotebookPen,
  Pencil,
  Trash2,
  UserX,
  Users,
  Video,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { useFormatters } from '@/hooks/use-formatters';
import { usePermissions } from '@/hooks/use-permissions';
import { useSession } from '@/contexts/session-context';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';
import {
  useDeleteInterviewMutation,
  useInterviewQuery,
  useUpdateInterviewStatusMutation,
} from '@/hooks/queries';
import {
  DetailDrawer,
  DetailPanel,
  EmptyState,
  PanelSection,
  RatingStars,
  StatusPill,
  ToolbarButton,
  type PillTone,
} from '@/components/patterns';
import { InitialsAvatar } from '@/components/ui/initials-avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { errorMessage } from '@/components/applications/application-meta';
import { StagePill } from '@/components/applications/stage-pill';
import type {
  Interview,
  InterviewDetail,
  InterviewStatus,
  Scorecard,
} from '@/types/interview.type';
import { ScorecardForm } from './scorecard-form';
import {
  INTERVIEW_STATUS_LABEL,
  INTERVIEW_STATUS_TONE,
  INTERVIEW_TYPE_LABEL,
  RECOMMENDATION_LABEL,
  RECOMMENDATION_TONE,
  candidateLabel,
  formatDuration,
  personLabel,
} from './interview-data';

function DetailItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium">{children}</dd>
    </div>
  );
}

function ScorecardCard({ scorecard }: { scorecard: Scorecard }) {
  const fmt = useFormatters();
  const name = personLabel(scorecard.interviewer) || 'Former team member';
  return (
    <div className="space-y-2.5 rounded-md border border-border p-3">
      <div className="flex items-center gap-2">
        <InitialsAvatar name={name} className="h-6 w-6 text-[10px]" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">
            {fmt.relative(scorecard.submittedAt)}
          </p>
        </div>
        <RatingStars value={scorecard.overallRating} size={14} />
        <StatusPill tone={RECOMMENDATION_TONE[scorecard.recommendation]}>
          {RECOMMENDATION_LABEL[scorecard.recommendation]}
        </StatusPill>
      </div>
      {scorecard.criteria.length > 0 && (
        <ul className="space-y-1.5 border-t border-border pt-2">
          {scorecard.criteria.map((c, i) => (
            <li key={`${c.name}-${i}`} className="text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">{c.name}</span>
                <RatingStars value={c.rating} size={13} />
              </div>
              {c.note && (
                <p className="text-xs text-muted-foreground">{c.note}</p>
              )}
            </li>
          ))}
        </ul>
      )}
      {scorecard.summary && (
        <p className="whitespace-pre-wrap border-t border-border pt-2 text-sm text-muted-foreground">
          {scorecard.summary}
        </p>
      )}
    </div>
  );
}

function DrawerSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

export function InterviewDetailDrawer({
  interviewId,
  open,
  onOpenChange,
  onEdit,
}: {
  interviewId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (interview: Interview) => void;
}) {
  const fmt = useFormatters();
  const { user } = useSession();
  const { hasPermission } = usePermissions();
  const canUpdate = hasPermission(PERMISSIONS_ENUM.INTERVIEW_UPDATE);
  const canDelete = hasPermission(PERMISSIONS_ENUM.INTERVIEW_DELETE);
  const canManage = hasPermission(PERMISSIONS_ENUM.INTERVIEW_MANAGE);
  const canScore = hasPermission(PERMISSIONS_ENUM.INTERVIEW_SCORECARD_SUBMIT);

  const {
    data: interview,
    isLoading,
    isError,
  } = useInterviewQuery(open ? interviewId : null);
  const updateStatus = useUpdateInterviewStatusMutation();
  const deleteInterview = useDeleteInterviewMutation();

  const [scoringFor, setScoringFor] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);

  const close = (o: boolean) => {
    if (!o) setScoringFor(null);
    onOpenChange(o);
  };

  const changeStatus = async (
    target: InterviewDetail,
    status: InterviewStatus,
    reason?: string,
  ) => {
    try {
      await updateStatus.mutateAsync({
        id: target.id,
        data: { status, ...(reason && { reason }) },
      });
      toast.success(
        `Marked as ${INTERVIEW_STATUS_LABEL[status].toLowerCase()}`,
      );
      return true;
    } catch (err) {
      toast.error('Could not update interview', errorMessage(err));
      return false;
    }
  };

  const confirmCancel = async () => {
    if (!interview) return;
    const ok = await changeStatus(
      interview,
      'cancelled',
      cancelReason.trim() || undefined,
    );
    if (ok) {
      setCancelOpen(false);
      setCancelReason('');
    }
  };

  const confirmDelete = async () => {
    if (!interview) return;
    try {
      await deleteInterview.mutateAsync(interview.id);
      toast.success('Interview deleted');
      setDeleteOpen(false);
      close(false);
    } catch (err) {
      toast.error('Could not delete interview', errorMessage(err));
    }
  };

  const name = interview ? candidateLabel(interview) : '';
  const scheduled = interview?.status === 'scheduled';
  const cancelled = interview?.status === 'cancelled';
  const isInterviewer =
    !!user && !!interview && interview.interviewerIds.includes(user.userId);
  const scorecardBy = (id: string) =>
    interview?.scorecards.find((s) => s.interviewerId === id) ?? null;
  const canScoreFor = (id: string) =>
    canScore && !cancelled && (id === user?.userId || canManage);
  const myScorecard = user ? scorecardBy(user.userId) : null;
  const scoringUser = interview?.interviewers.find((i) => i.id === scoringFor);

  return (
    <>
      <DetailDrawer
        open={open}
        onOpenChange={close}
        title={interview ? `${interview.title} with ${name}` : 'Interview'}
        chips={
          interview && (
            <StatusPill tone={INTERVIEW_STATUS_TONE[interview.status]} dot>
              {INTERVIEW_STATUS_LABEL[interview.status]}
            </StatusPill>
          )
        }
        footer={
          interview && (
            <div className="flex flex-wrap justify-end gap-2">
              {canDelete && (
                <ToolbarButton
                  variant="ghost"
                  icon={Trash2}
                  onClick={() => setDeleteOpen(true)}
                >
                  Delete
                </ToolbarButton>
              )}
              {canUpdate && scheduled && (
                <>
                  <ToolbarButton
                    variant="ghost"
                    icon={CalendarX}
                    onClick={() => setCancelOpen(true)}
                  >
                    Cancel interview
                  </ToolbarButton>
                  <ToolbarButton
                    icon={UserX}
                    disabled={updateStatus.isPending}
                    onClick={() => changeStatus(interview, 'no_show')}
                  >
                    No show
                  </ToolbarButton>
                  <ToolbarButton
                    icon={CheckCircle2}
                    disabled={updateStatus.isPending}
                    onClick={() => changeStatus(interview, 'completed')}
                  >
                    Mark completed
                  </ToolbarButton>
                </>
              )}
              {canUpdate && !cancelled && onEdit && (
                <ToolbarButton
                  icon={scheduled ? CalendarClock : Pencil}
                  onClick={() => onEdit(interview)}
                >
                  {scheduled ? 'Reschedule' : 'Edit'}
                </ToolbarButton>
              )}
              {isInterviewer &&
                user &&
                canScoreFor(user.userId) &&
                scoringFor === null && (
                  <ToolbarButton
                    variant="primary"
                    icon={ClipboardCheck}
                    onClick={() => setScoringFor(user.userId)}
                  >
                    {myScorecard ? 'Edit my scorecard' : 'Submit my scorecard'}
                  </ToolbarButton>
                )}
              {scheduled && interview.meetingUrl && !isInterviewer && (
                <a
                  href={interview.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ToolbarButton variant="primary" icon={Video}>
                    Join call
                  </ToolbarButton>
                </a>
              )}
            </div>
          )
        }
      >
        {isLoading && <DrawerSkeleton />}
        {!isLoading && (isError || !interview) && (
          <EmptyState title="Could not load interview" />
        )}
        {interview && (
          <DetailPanel>
            <div className="flex items-center gap-3">
              <InitialsAvatar name={name} className="h-10 w-10 text-sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {[interview.job.title, interview.client?.name]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              <StagePill stage={interview.application.stage} />
            </div>

            <PanelSection
              icon={<CalendarClock className="h-4 w-4" />}
              title="Details"
            >
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-md border border-border p-3 text-sm">
                <DetailItem label="Date">
                  {fmt.dateLong(interview.scheduledAt, {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                  , {fmt.time(interview.scheduledAt)}
                </DetailItem>
                <DetailItem label="Length">
                  {formatDuration(interview.durationMinutes)}
                </DetailItem>
                <DetailItem label="Type">
                  {INTERVIEW_TYPE_LABEL[interview.type]}
                </DetailItem>
                <DetailItem label="Candidate timezone">
                  {interview.timezone.replace(/_/g, ' ')}
                </DetailItem>
                <DetailItem label="Location">
                  {interview.location || 'Not set'}
                </DetailItem>
                <DetailItem label="Meeting link">
                  {interview.meetingUrl ? (
                    <a
                      href={interview.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#3F6650] hover:underline dark:text-[#8FBFA1]"
                    >
                      {interview.meetingUrl.replace(/^https?:\/\//, '')}
                    </a>
                  ) : (
                    'Not set'
                  )}
                </DetailItem>
                <DetailItem label="Organizer">
                  {personLabel(interview.organizer) || 'Not set'}
                </DetailItem>
                <DetailItem label="Scorecards">
                  {interview.scorecardCount}/{interview.interviewerCount}
                  {interview.averageRating !== null &&
                    `, avg ${interview.averageRating.toFixed(1)}`}
                </DetailItem>
              </dl>
              {interview.cancelledReason && (
                <p className="mt-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                  Cancelled: {interview.cancelledReason}
                </p>
              )}
            </PanelSection>

            {interview.notes && (
              <PanelSection
                icon={<NotebookPen className="h-4 w-4" />}
                title="Notes for the panel"
              >
                <p className="whitespace-pre-wrap rounded-md border border-border p-3 text-sm text-muted-foreground">
                  {interview.notes}
                </p>
              </PanelSection>
            )}

            <PanelSection
              icon={<Users className="h-4 w-4" />}
              title="Interviewers"
            >
              <ul className="divide-y divide-border rounded-md border border-border">
                {interview.interviewers.map((person) => {
                  const card = scorecardBy(person.id);
                  const label = card
                    ? 'Submitted'
                    : cancelled || scheduled
                      ? 'Invited'
                      : 'Pending';
                  const tone: PillTone = card
                    ? 'success'
                    : label === 'Pending'
                      ? 'warning'
                      : 'neutral';
                  const pname = personLabel(person);
                  return (
                    <li
                      key={person.id}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm"
                    >
                      <InitialsAvatar
                        name={pname}
                        className="h-6 w-6 text-[10px]"
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {pname}
                        {person.id === user?.userId && (
                          <span className="text-muted-foreground"> (you)</span>
                        )}
                      </span>
                      {canScoreFor(person.id) &&
                        person.id !== user?.userId &&
                        scoringFor === null && (
                          <button
                            type="button"
                            onClick={() => setScoringFor(person.id)}
                            className="text-xs font-medium text-[#3F6650] hover:underline dark:text-[#8FBFA1]"
                          >
                            {card ? 'Edit scorecard' : 'Add scorecard'}
                          </button>
                        )}
                      <StatusPill tone={tone}>{label}</StatusPill>
                    </li>
                  );
                })}
              </ul>
            </PanelSection>

            <PanelSection
              icon={<ClipboardCheck className="h-4 w-4" />}
              title="Scorecards"
            >
              <div className="space-y-3">
                {scoringFor && (
                  <ScorecardForm
                    key={scoringFor}
                    interviewId={interview.id}
                    interviewerId={scoringFor}
                    interviewerName={personLabel(scoringUser)}
                    existing={scorecardBy(scoringFor)}
                    onDone={() => setScoringFor(null)}
                    onCancel={() => setScoringFor(null)}
                  />
                )}
                {interview.scorecards
                  .filter((s) => s.interviewerId !== scoringFor)
                  .map((s) => (
                    <ScorecardCard key={s.id} scorecard={s} />
                  ))}
                {interview.scorecards.length === 0 && !scoringFor && (
                  <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
                    {cancelled
                      ? 'Interview was cancelled'
                      : interview.feedbackDue
                        ? 'Waiting on interviewer feedback'
                        : 'No scorecards yet'}
                  </p>
                )}
              </div>
            </PanelSection>
          </DetailPanel>
        )}
      </DetailDrawer>

      <Dialog
        open={cancelOpen}
        onOpenChange={(o) => {
          setCancelOpen(o);
          if (!o) setCancelReason('');
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel interview</DialogTitle>
            <DialogDescription>
              The interview stays on record as cancelled
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="cancel-reason" className="text-xs">
              Reason
            </Label>
            <Textarea
              id="cancel-reason"
              rows={3}
              maxLength={500}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Candidate withdrew, panel unavailable, role on hold"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelOpen(false)}
            >
              Keep interview
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={updateStatus.isPending}
              onClick={confirmCancel}
            >
              {updateStatus.isPending ? 'Cancelling' : 'Cancel interview'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete interview</AlertDialogTitle>
            <AlertDialogDescription>
              The interview and its scorecards are removed permanently. This
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
    </>
  );
}
