'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Check,
  Clock,
  Pencil,
  Send,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Undo2,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { InitialsAvatar } from '@/components/ui/initials-avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DetailDrawer,
  DetailPanel,
  PanelSection,
  StatusPill,
  Timeline,
  ToolbarButton,
  type ToolbarButtonVariant,
} from '@/components/patterns';
import { ConfirmDialog } from '@/components/jobs/confirm-dialog';
import { EMPLOYMENT_TYPE_LABEL } from '@/components/jobs/job-utils';
import {
  errorMessage,
  userLabel,
} from '@/components/applications/application-meta';
import { useSession } from '@/contexts/session-context';
import { usePermissions } from '@/hooks/use-permissions';
import { useFormatters } from '@/hooks/use-formatters';
import {
  useActivitiesQuery,
  useApproveOfferMutation,
  useDeleteOfferMutation,
  useRejectOfferMutation,
  useRespondOfferMutation,
  useSendOfferMutation,
  useSubmitOfferMutation,
  useWithdrawOfferMutation,
} from '@/hooks/queries';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';
import type { Offer, OfferStatus } from '@/types/offer.type';
import {
  CLOSED_STATUSES,
  DELETABLE_STATUSES,
  EDITABLE_STATUSES,
  OFFER_STATUS_LABEL,
  OFFER_STATUS_TONE,
  WITHDRAWABLE_STATUSES,
  approvalSummary,
  approverName,
  candidateName,
  offerSalary,
} from './offer-meta';
import { OfferSignatureSection } from './offer-signature-section';
import {
  OfferReasonDialog,
  type OfferReasonDialogConfig,
} from './offer-reason-dialog';
import { PlanFeature } from '@boilerplate/shared';
import { usePlanFeature } from '@/hooks/queries/use-billing-query';
import { UpgradeHint } from '@/components/billing/upgrade-hint';

const NO_PERMISSION = 'You do not have permission for this action';

function statusReason(status: OfferStatus, allowed: OfferStatus[]) {
  const expected = allowed.map((s) => OFFER_STATUS_LABEL[s].toLowerCase());
  return `Only available when the offer is ${expected.join(' or ')}, this one is ${OFFER_STATUS_LABEL[status].toLowerCase()}`;
}

function ActionButton({
  icon,
  label,
  onClick,
  disabledReason,
  variant,
  pending,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabledReason?: string | null;
  variant?: ToolbarButtonVariant;
  pending?: boolean;
}) {
  const button = (
    <ToolbarButton
      variant={variant}
      icon={icon}
      onClick={onClick}
      disabled={!!disabledReason || pending}
    >
      {label}
    </ToolbarButton>
  );
  if (!disabledReason) return button;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0} className="inline-flex">
            {button}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">{disabledReason}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function OfferActivity({ offer }: { offer: Offer }) {
  const fmt = useFormatters();
  const { data, isLoading } = useActivitiesQuery({
    applicationId: offer.applicationId,
    page: 1,
    limit: 100,
  });
  const entries = (data?.data ?? [])
    .filter((a) => a.metadata?.offerId === offer.id)
    .map((a) => ({
      id: a.id,
      title: a.title,
      meta: [userLabel(a.actor), a.body].filter(Boolean).join(' · '),
      time: fmt.relative(a.createdAt),
    }));
  if (isLoading) return <Skeleton className="h-16 w-full" />;
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity yet</p>;
  }
  return <Timeline entries={entries} />;
}

export function OfferDetailDrawer({
  open,
  onOpenChange,
  offer,
  loading,
  onEdit,
  onDeleted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer: Offer | null;
  loading?: boolean;
  onEdit: (offer: Offer) => void;
  onDeleted: () => void;
}) {
  const fmt = useFormatters();
  const { user } = useSession();
  const { hasPermission } = usePermissions();
  const [reasonDialog, setReasonDialog] =
    useState<OfferReasonDialogConfig | null>(null);
  const [deleting, setDeleting] = useState(false);
  const submitOffer = useSubmitOfferMutation();
  const approveOffer = useApproveOfferMutation();
  const rejectOffer = useRejectOfferMutation();
  const sendOffer = useSendOfferMutation();
  const respondOffer = useRespondOfferMutation();
  const withdrawOffer = useWithdrawOfferMutation();
  const deleteOffer = useDeleteOfferMutation();

  const pending =
    submitOffer.isPending ||
    sendOffer.isPending ||
    respondOffer.isPending ||
    approveOffer.isPending ||
    rejectOffer.isPending ||
    withdrawOffer.isPending;

  const run = async (
    action: () => Promise<Offer>,
    success: string,
    failure: string,
  ) => {
    try {
      const result = await action();
      toast.success(success, result.title);
    } catch (e) {
      toast.error(failure, errorMessage(e));
      throw e;
    }
  };

  const guard = (permission: boolean, allowed: OfferStatus[]) => {
    if (!offer) return null;
    if (!allowed.includes(offer.status)) {
      return statusReason(offer.status, allowed);
    }
    return permission ? null : NO_PERMISSION;
  };

  const canUpdate = hasPermission(PERMISSIONS_ENUM.OFFER_UPDATE);
  const canApprove = hasPermission(PERMISSIONS_ENUM.OFFER_APPROVE);
  const canSend = hasPermission(PERMISSIONS_ENUM.OFFER_SEND);
  const canDelete = hasPermission(PERMISSIONS_ENUM.OFFER_DELETE);
  const { hasFeature: hasESign } = usePlanFeature(PlanFeature.OFFER_ESIGN);

  const decisionReason = () => {
    if (!offer) return null;
    const status = guard(canApprove, ['pending_approval']);
    if (status) return status;
    const me = offer.approvers.find((a) => a.id === user?.userId);
    if (!me) return 'Only approvers listed on this offer can decide';
    if (me.decision) return 'You have already recorded your decision';
    return null;
  };

  const footer = offer && (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex gap-2">
        {!CLOSED_STATUSES.includes(offer.status) && (
          <ActionButton
            icon={Undo2}
            label="Withdraw"
            variant="ghost"
            pending={pending}
            disabledReason={guard(canUpdate, WITHDRAWABLE_STATUSES)}
            onClick={() =>
              setReasonDialog({
                title: 'Withdraw offer',
                description: `${candidateName(offer)} will no longer be able to accept this offer`,
                label: 'Reason',
                placeholder: 'Why is the offer being withdrawn?',
                confirmLabel: 'Withdraw offer',
                destructive: true,
                maxLength: 500,
                onConfirm: (reason) =>
                  run(
                    () =>
                      withdrawOffer.mutateAsync({
                        id: offer.id,
                        data: reason ? { reason } : {},
                      }),
                    'Offer withdrawn',
                    'Could not withdraw offer',
                  ),
              })
            }
          />
        )}
        {DELETABLE_STATUSES.includes(offer.status) && (
          <ActionButton
            icon={Trash2}
            label="Delete"
            variant="ghost"
            pending={pending}
            disabledReason={canDelete ? null : NO_PERMISSION}
            onClick={() => setDeleting(true)}
          />
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {EDITABLE_STATUSES.includes(offer.status) && (
          <ActionButton
            icon={Pencil}
            label={offer.status === 'rejected' ? 'Revise' : 'Edit'}
            pending={pending}
            disabledReason={canUpdate ? null : NO_PERMISSION}
            onClick={() => onEdit(offer)}
          />
        )}
        {offer.status === 'draft' && (
          <ActionButton
            icon={Send}
            variant="primary"
            label={
              offer.approvers.length > 0 ? 'Submit for approval' : 'Submit'
            }
            pending={pending}
            disabledReason={canUpdate ? null : NO_PERMISSION}
            onClick={() =>
              run(
                () => submitOffer.mutateAsync(offer.id),
                offer.approvers.length > 0
                  ? 'Submitted for approval'
                  : 'Offer approved',
                'Could not submit offer',
              ).catch(() => undefined)
            }
          />
        )}
        {offer.status === 'pending_approval' && (
          <>
            <ActionButton
              icon={ThumbsDown}
              label="Reject"
              pending={pending}
              disabledReason={decisionReason()}
              onClick={() =>
                setReasonDialog({
                  title: 'Reject offer',
                  description:
                    'The offer goes back to the recruiter to revise and resubmit',
                  label: 'Comment',
                  placeholder: 'What needs to change?',
                  confirmLabel: 'Reject offer',
                  required: true,
                  destructive: true,
                  maxLength: 1000,
                  onConfirm: (comment) =>
                    run(
                      () =>
                        rejectOffer.mutateAsync({
                          id: offer.id,
                          data: { comment },
                        }),
                      'Offer rejected',
                      'Could not reject offer',
                    ),
                })
              }
            />
            <ActionButton
              icon={ThumbsUp}
              variant="primary"
              label="Approve"
              pending={pending}
              disabledReason={decisionReason()}
              onClick={() =>
                setReasonDialog({
                  title: 'Approve offer',
                  description:
                    'The offer is approved once every approver has approved it',
                  label: 'Comment',
                  confirmLabel: 'Approve offer',
                  maxLength: 1000,
                  onConfirm: (comment) =>
                    run(
                      () =>
                        approveOffer.mutateAsync({
                          id: offer.id,
                          data: comment ? { comment } : {},
                        }),
                      'Approval recorded',
                      'Could not approve offer',
                    ),
                })
              }
            />
          </>
        )}
        {offer.status === 'approved' && !hasESign && (
          <UpgradeHint
            feature={PlanFeature.OFFER_ESIGN}
            action="collect e-signatures"
            className="self-center"
          />
        )}
        {offer.status === 'approved' && (
          <ActionButton
            icon={Send}
            variant="primary"
            label="Send to candidate"
            pending={pending}
            disabledReason={canSend ? null : NO_PERMISSION}
            onClick={() =>
              run(
                () => sendOffer.mutateAsync(offer.id),
                'Offer sent to candidate',
                'Could not send offer',
              ).catch(() => undefined)
            }
          />
        )}
        {offer.status === 'sent' && (
          <>
            <ActionButton
              icon={X}
              label="Mark declined"
              pending={pending}
              disabledReason={canUpdate ? null : NO_PERMISSION}
              onClick={() =>
                setReasonDialog({
                  title: 'Record decline',
                  description: `Record that ${candidateName(offer)} declined the offer`,
                  label: 'Decline reason',
                  placeholder:
                    'Compensation, counter offer, accepted elsewhere',
                  confirmLabel: 'Mark declined',
                  destructive: true,
                  maxLength: 500,
                  onConfirm: (reason) =>
                    run(
                      () =>
                        respondOffer.mutateAsync({
                          id: offer.id,
                          data: { response: 'declined', reason },
                        }),
                      'Offer marked declined',
                      'Could not record response',
                    ),
                })
              }
            />
            <ActionButton
              icon={Check}
              variant="primary"
              label="Mark accepted"
              pending={pending}
              disabledReason={canUpdate ? null : NO_PERMISSION}
              onClick={() =>
                run(
                  () =>
                    respondOffer.mutateAsync({
                      id: offer.id,
                      data: { response: 'accepted' },
                    }),
                  'Offer accepted',
                  'Could not record response',
                ).catch(() => undefined)
              }
            />
          </>
        )}
        {CLOSED_STATUSES.includes(offer.status) &&
          !DELETABLE_STATUSES.includes(offer.status) && (
            <span className="text-xs text-muted-foreground">
              This offer is closed, no further actions
            </span>
          )}
      </div>
    </div>
  );

  const details: [string, string][] = offer
    ? [
        ['Salary', offerSalary(offer, fmt)],
        ['Bonus', offer.bonus || 'None'],
        ['Equity', offer.equity || 'None'],
        [
          'Employment type',
          offer.employmentType
            ? EMPLOYMENT_TYPE_LABEL[offer.employmentType]
            : 'Not set',
        ],
        ['Location', offer.location || 'Not set'],
        ['Start date', offer.startDate ? fmt.date(offer.startDate) : 'Not set'],
        ['Expires', offer.expiresAt ? fmt.date(offer.expiresAt) : 'Not set'],
        ['Created by', userLabel(offer.creator) || 'Unknown'],
        ...(offer.sentAt
          ? ([['Sent', fmt.dateTime(offer.sentAt)]] as [string, string][])
          : []),
        ...(offer.respondedAt
          ? ([['Responded', fmt.dateTime(offer.respondedAt)]] as [
              string,
              string,
            ][])
          : []),
      ]
    : [];

  return (
    <>
      <DetailDrawer
        open={open}
        onOpenChange={onOpenChange}
        title={offer ? `Offer for ${candidateName(offer)}` : 'Offer'}
        chips={
          offer && (
            <StatusPill tone={OFFER_STATUS_TONE[offer.status]} dot>
              {OFFER_STATUS_LABEL[offer.status]}
            </StatusPill>
          )
        }
        footer={footer}
      >
        {!offer ? (
          loading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Offer not found</p>
          )
        ) : (
          <DetailPanel>
            <div className="flex items-center gap-3">
              <InitialsAvatar
                name={candidateName(offer)}
                className="h-10 w-10 text-sm"
              />
              <div className="min-w-0">
                <p className="font-semibold">{candidateName(offer)}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {offer.title}
                  {' · '}
                  <Link
                    href={`/dashboard/jobs?id=${offer.jobId}`}
                    className="hover:underline"
                  >
                    {offer.job.title}
                  </Link>
                  {offer.client && ` · ${offer.client.name}`}
                </p>
              </div>
            </div>

            {offer.declineReason && (
              <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
                <p className="text-xs text-muted-foreground">
                  {offer.status === 'withdrawn'
                    ? 'Withdrawal reason'
                    : 'Decline reason'}
                </p>
                <p>{offer.declineReason}</p>
              </div>
            )}

            <PanelSection title="Summary">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-md border border-border p-3 text-sm">
                {details.map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs text-muted-foreground">{k}</dt>
                    <dd className="font-medium tabular-nums">{v}</dd>
                  </div>
                ))}
              </dl>
            </PanelSection>

            <PanelSection
              title={
                offer.approvers.length > 0
                  ? `Approvals · ${approvalSummary(offer)}`
                  : 'Approvals'
              }
            >
              {offer.approvers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No approvers, the offer is approved on submit
                </p>
              ) : (
                <ol className="divide-y divide-border rounded-md border border-border">
                  {offer.approvers.map((a, i) => {
                    const waiting =
                      offer.status === 'pending_approval' && !a.decision;
                    return (
                      <li key={a.id} className="space-y-1 px-3 py-2 text-sm">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={cn(
                              'flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold',
                              a.decision === 'approved'
                                ? 'bg-[#3F6650] text-white dark:bg-[#8FBFA1] dark:text-[#0f1a14]'
                                : a.decision === 'rejected'
                                  ? 'bg-red-600 text-white dark:bg-red-400 dark:text-red-950'
                                  : 'border border-border text-muted-foreground',
                            )}
                          >
                            {a.decision === 'approved' ? (
                              <Check className="h-3 w-3" />
                            ) : a.decision === 'rejected' ? (
                              <X className="h-3 w-3" />
                            ) : (
                              i + 1
                            )}
                          </span>
                          <span className="flex-1">
                            {approverName(a)}
                            {a.id === user?.userId && (
                              <span className="text-muted-foreground">
                                {' '}
                                (you)
                              </span>
                            )}
                          </span>
                          {a.decision ? (
                            <StatusPill
                              tone={
                                a.decision === 'approved' ? 'success' : 'danger'
                              }
                            >
                              {a.decision === 'approved'
                                ? 'Approved'
                                : 'Rejected'}
                            </StatusPill>
                          ) : (
                            <StatusPill
                              tone={waiting ? 'warning' : 'neutral'}
                              icon={
                                waiting ? (
                                  <Clock className="h-3 w-3" />
                                ) : undefined
                              }
                            >
                              {waiting ? 'Waiting' : 'Not requested'}
                            </StatusPill>
                          )}
                        </div>
                        {(a.comment || a.decidedAt) && (
                          <p className="pl-7 text-xs text-muted-foreground">
                            {[
                              a.decidedAt && fmt.dateTime(a.decidedAt),
                              a.comment,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ol>
              )}
            </PanelSection>

            <OfferSignatureSection offer={offer} />

            <PanelSection
              title={
                offer.sentLetterBody ? 'Offer letter as sent' : 'Offer letter'
              }
            >
              {offer.sentLetterBody || offer.body ? (
                <div className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-3 text-sm">
                  {offer.sentLetterBody || offer.body}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  The default letter from your offer template is used
                </p>
              )}
            </PanelSection>

            <PanelSection title="Activity">
              <OfferActivity offer={offer} />
            </PanelSection>
          </DetailPanel>
        )}
      </DetailDrawer>

      <OfferReasonDialog
        config={reasonDialog}
        onOpenChange={(o) => !o && setReasonDialog(null)}
      />

      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title="Delete offer"
        description={
          offer
            ? `The offer for ${candidateName(offer)} will be removed. This cannot be undone.`
            : undefined
        }
        onConfirm={async () => {
          if (!offer) return;
          try {
            await deleteOffer.mutateAsync(offer.id);
            toast.success('Offer deleted', offer.title);
            onDeleted();
          } catch (e) {
            toast.error('Could not delete offer', errorMessage(e));
            throw e;
          }
        }}
      />
    </>
  );
}
