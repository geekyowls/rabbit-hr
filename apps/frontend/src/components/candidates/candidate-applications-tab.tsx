'use client';

import { useFormatters } from '@/hooks/use-formatters';
import { useState } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  CalendarPlus,
  FileSignature,
  Link2,
  Mail,
  Plus,
  Star,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import {
  EmptyState,
  RatingStars,
  StatusPill,
  ToolbarButton,
} from '@/components/patterns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { usePermissions } from '@/hooks/use-permissions';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';
import {
  useUpdateApplicationMutation,
  useUpdateApplicationStageMutation,
} from '@/hooks/queries';
import type { ApplicationStage } from '@/types/application.type';
import type {
  CandidateApplicationSummary,
  CandidateDetail,
} from '@/types/candidate.type';
import {
  daysSince,
  errorMessage,
  usePipelineStageMeta,
} from '@/components/applications/application-meta';
import { StagePill } from '@/components/applications/stage-pill';
import { RejectApplicationDialog } from '@/components/applications/reject-application-dialog';

export function CandidateApplicationsTab({
  candidate,
  focusedApplicationId,
  onEmail,
  onAddToJob,
  onSchedule,
  onBookingLink,
}: {
  candidate: CandidateDetail;
  focusedApplicationId?: string | null;
  onEmail: (application: CandidateApplicationSummary) => void;
  onAddToJob: () => void;
  onSchedule: (application: CandidateApplicationSummary) => void;
  onBookingLink: (application: CandidateApplicationSummary) => void;
}) {
  const { hasPermission } = usePermissions();
  const canUpdate = hasPermission(PERMISSIONS_ENUM.APPLICATION_UPDATE);
  const updateStage = useUpdateApplicationStageMutation();
  const updateApplication = useUpdateApplicationMutation();
  const stageMeta = usePipelineStageMeta();
  const fmt = useFormatters();
  const [rejecting, setRejecting] =
    useState<CandidateApplicationSummary | null>(null);
  const name = `${candidate.firstName} ${candidate.lastName}`;

  const moveStage = async (
    app: CandidateApplicationSummary,
    stage: ApplicationStage,
    rejectionReason?: string,
  ) => {
    if (stage === app.stage) return;
    if (stageMeta.isRejected(stage) && !rejectionReason) {
      setRejecting(app);
      return;
    }
    try {
      await updateStage.mutateAsync({
        id: app.id,
        data: { stage, ...(rejectionReason && { rejectionReason }) },
      });
      toast.success(`Moved to ${stageMeta.label(stage)}`);
    } catch (err) {
      toast.error('Could not move stage', errorMessage(err));
      throw err;
    }
  };

  const patch = async (
    app: CandidateApplicationSummary,
    data: { rating?: number | null; shortlisted?: boolean },
  ) => {
    try {
      await updateApplication.mutateAsync({ id: app.id, data });
    } catch (err) {
      toast.error('Could not update application', errorMessage(err));
    }
  };

  const apps = [...candidate.applications].sort((a, b) =>
    a.id === focusedApplicationId
      ? -1
      : b.id === focusedApplicationId
        ? 1
        : new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime(),
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          {apps.length} {apps.length === 1 ? 'application' : 'applications'}
        </p>
        <PermissionGuard permissions={PERMISSIONS_ENUM.APPLICATION_CREATE}>
          <ToolbarButton icon={Plus} onClick={onAddToJob}>
            Add to job
          </ToolbarButton>
        </PermissionGuard>
      </div>

      {apps.length === 0 && (
        <EmptyState
          compact
          icon={<Briefcase className="h-5 w-5" />}
          title="Not considered for any job yet"
          description="Add this candidate to a published job to start tracking them in the pipeline"
        />
      )}

      {apps.map((app) => (
        <div
          key={app.id}
          className={cn(
            'space-y-3 rounded-md border px-4 py-3',
            app.id === focusedApplicationId
              ? 'border-[#3F6650]/50 bg-[#EDF1EE]/50 dark:border-[#8FBFA1]/40 dark:bg-[#3F6650]/10'
              : 'border-border',
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{app.jobTitle}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {[app.clientName, app.jobReference]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                <p className="text-xs text-muted-foreground">
                  Applied {fmt.date(app.appliedAt)} ·{' '}
                  {daysSince(app.stageChangedAt)}d in stage
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!canUpdate}
                aria-label={
                  app.shortlisted ? 'Remove from shortlist' : 'Shortlist'
                }
                title={app.shortlisted ? 'Shortlisted' : 'Shortlist'}
                onClick={() => patch(app, { shortlisted: !app.shortlisted })}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-border hover:bg-accent disabled:opacity-50"
              >
                <Star
                  className={cn(
                    'h-3.5 w-3.5',
                    app.shortlisted
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-muted-foreground',
                  )}
                />
              </button>
              <Select
                value={app.stage}
                disabled={!canUpdate || updateStage.isPending}
                onValueChange={(v) =>
                  moveStage(app, v as ApplicationStage).catch(() => undefined)
                }
              >
                <SelectTrigger className="h-7 w-[140px] text-xs">
                  <SelectValue>
                    <StagePill stage={app.stage} />
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {stageMeta.stages.map((s) => (
                    <SelectItem key={s.key} value={s.key} className="text-xs">
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {stageMeta.isRejected(app.stage) && app.rejectionReason && (
            <p className="rounded-md bg-red-50 px-2.5 py-1.5 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-400">
              Rejected: {app.rejectionReason}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              Rating
              <RatingStars
                value={app.rating ?? 0}
                size={13}
                onChange={
                  canUpdate
                    ? (v) => patch(app, { rating: v || null })
                    : undefined
                }
              />
            </div>
            <div className="flex items-center gap-1.5">
              <PermissionGuard
                permissions={PERMISSIONS_ENUM.EMAIL_TEMPLATE_SEND}
              >
                <ToolbarButton icon={Mail} onClick={() => onEmail(app)}>
                  Send email
                </ToolbarButton>
              </PermissionGuard>
              <PermissionGuard permissions={PERMISSIONS_ENUM.INTERVIEW_CREATE}>
                <ToolbarButton
                  icon={CalendarPlus}
                  onClick={() => onSchedule(app)}
                >
                  Schedule interview
                </ToolbarButton>
              </PermissionGuard>
              {!stageMeta.isRejected(app.stage) && (
                <PermissionGuard
                  permissions={PERMISSIONS_ENUM.INTERVIEW_CREATE}
                >
                  <ToolbarButton
                    icon={Link2}
                    onClick={() => onBookingLink(app)}
                  >
                    Send booking link
                  </ToolbarButton>
                </PermissionGuard>
              )}
              {!stageMeta.isRejected(app.stage) && (
                <PermissionGuard permissions={PERMISSIONS_ENUM.OFFER_CREATE}>
                  <Link
                    href={`/dashboard/offers?new=1&applicationId=${app.id}`}
                  >
                    <ToolbarButton icon={FileSignature}>
                      Make offer
                    </ToolbarButton>
                  </Link>
                </PermissionGuard>
              )}
              {canUpdate &&
                stageMeta.rejectKey &&
                !stageMeta.isRejected(app.stage) && (
                  <ToolbarButton
                    variant="danger"
                    icon={X}
                    onClick={() => setRejecting(app)}
                  >
                    Reject
                  </ToolbarButton>
                )}
            </div>
          </div>
        </div>
      ))}

      <RejectApplicationDialog
        open={rejecting !== null}
        onOpenChange={(o) => !o && setRejecting(null)}
        candidateName={name}
        onConfirm={async (reason) => {
          if (rejecting && stageMeta.rejectKey) {
            await moveStage(rejecting, stageMeta.rejectKey, reason);
          }
        }}
      />
    </div>
  );
}
