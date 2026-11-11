'use client';

import Link from 'next/link';
import { ExternalLink, Pencil, Trash2, Users } from 'lucide-react';
import {
  DetailDrawer,
  DetailPanel,
  PanelSection,
  StatusPill,
  ToolbarButton,
  IconButton,
} from '@/components/patterns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { InitialsAvatar } from '@/components/ui/initials-avatar';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';
import { useSession } from '@/contexts/session-context';
import { JOB_STATUSES, type JobDetail, type JobStatus } from '@/types/job.type';
import { useCustomFieldsQuery } from '@/hooks/queries';
import { useFormatters } from '@/hooks/use-formatters';
import { CustomFieldsView } from '@/components/custom-fields/custom-fields-view';
import type { UserSummary } from '@/types/common.type';
import {
  EMPLOYMENT_TYPE_LABEL,
  JOB_STATUS_LABEL,
  JOB_STATUS_TONE,
  WORK_MODE_LABEL,
} from './job-utils';
import {
  usePipelineStageMeta,
  userLabel,
} from '@/components/applications/application-meta';

function TagList({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0)
    return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((s) => (
        <span
          key={s}
          className="rounded-md border border-border bg-muted px-2 py-0.5 text-xs"
        >
          {s}
        </span>
      ))}
    </div>
  );
}

export function JobDetailDrawer({
  job,
  loading,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onStatusChange,
  statusPending,
}: {
  job: JobDetail | null;
  loading?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (job: JobDetail) => void;
  onDelete: (job: JobDetail) => void;
  onStatusChange: (job: JobDetail, status: JobStatus) => void;
  statusPending?: boolean;
}) {
  const { organization } = useSession();
  const slug = organization?.slug;
  const { flowStages, closedStages } = usePipelineStageMeta(open);
  const fmt = useFormatters();
  const { data: fieldDefs = [] } = useCustomFieldsQuery(
    { entity: 'job', activeOnly: true },
    open,
  );

  const team: { user: UserSummary; role: string }[] = job
    ? [
        ...(job.hiringManager
          ? [{ user: job.hiringManager, role: 'Hiring manager' }]
          : []),
        ...(job.recruiter ? [{ user: job.recruiter, role: 'Recruiter' }] : []),
        ...(job.hiringTeam ?? [])
          .filter(
            (u) => u.id !== job.hiringManagerId && u.id !== job.recruiterId,
          )
          .map((user) => ({ user, role: 'Team member' })),
      ]
    : [];

  const details: [string, string][] = job
    ? [
        ['Reference', job.reference],
        ['Client', job.client?.name ?? 'No client'],
        ['Department', job.department || 'Not set'],
        ['Location', job.location || 'Not set'],
        ['Work mode', WORK_MODE_LABEL[job.workMode]],
        ['Employment type', EMPLOYMENT_TYPE_LABEL[job.employmentType]],
        ['Openings', String(job.openings)],
        [
          job.employmentType === 'permanent' ? 'Salary' : 'Pay rate',
          fmt.pay(job),
        ],
        ...(job.employmentType !== 'permanent' && job.chargeRate != null
          ? ([
              [
                'Charge rate',
                fmt.payRate(
                  Number(job.chargeRate),
                  job.rateUnit ?? 'hour',
                  job.currency || fmt.currency,
                ),
              ],
            ] as [string, string][])
          : []),
        ['Closing date', fmt.date(job.closingDate) || 'Not set'],
        ['Published', fmt.date(job.publishedAt) || 'Not published'],
        [
          'Owner',
          job.owner
            ? [job.owner.firstName, job.owner.lastName]
                .filter(Boolean)
                .join(' ') || job.owner.email
            : 'Unassigned',
        ],
      ]
    : [];

  const other = job
    ? closedStages.reduce((n, s) => n + (job.stageCounts?.[s.key] ?? 0), 0)
    : 0;

  return (
    <DetailDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={job?.title ?? ''}
      chips={
        job && (
          <StatusPill tone={JOB_STATUS_TONE[job.status]} dot>
            {JOB_STATUS_LABEL[job.status]}
          </StatusPill>
        )
      }
      footer={
        job && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <PermissionGuard permissions={PERMISSIONS_ENUM.JOB_UPDATE}>
              <Select
                value={job.status}
                disabled={statusPending}
                onValueChange={(v) => onStatusChange(job, v as JobStatus)}
              >
                <SelectTrigger className="h-8 w-40 text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JOB_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {JOB_STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </PermissionGuard>
            <div className="flex flex-wrap gap-2">
              <PermissionGuard permissions={PERMISSIONS_ENUM.JOB_DELETE}>
                <IconButton
                  icon={Trash2}
                  label="Delete job"
                  onClick={() => onDelete(job)}
                />
              </PermissionGuard>
              <PermissionGuard permissions={PERMISSIONS_ENUM.JOB_UPDATE}>
                <ToolbarButton icon={Pencil} onClick={() => onEdit(job)}>
                  Edit
                </ToolbarButton>
              </PermissionGuard>
              {job.status === 'published' && slug && (
                <a
                  href={`/careers/job?org=${encodeURIComponent(slug)}&id=${job.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ToolbarButton icon={ExternalLink}>
                    View careers page
                  </ToolbarButton>
                </a>
              )}
              <Link href={`/dashboard/pipeline?jobId=${job.id}`}>
                <ToolbarButton variant="primary" icon={Users}>
                  View pipeline
                </ToolbarButton>
              </Link>
            </div>
          </div>
        )
      }
    >
      {loading && !job && (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}
      {job && (
        <DetailPanel>
          <PanelSection title="Details">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-md border border-border p-3 text-sm">
              {details.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </PanelSection>

          <PanelSection title="Hiring team">
            {team.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hiring team assigned
              </p>
            ) : (
              <ul className="divide-y divide-border rounded-md border border-border">
                {team.map(({ user, role }) => (
                  <li
                    key={`${role}-${user.id}`}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm"
                  >
                    <InitialsAvatar
                      name={userLabel(user)}
                      className="h-6 w-6 text-[10px]"
                    />
                    <span className="flex-1 font-medium">
                      {userLabel(user)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {role}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </PanelSection>

          {fieldDefs.length > 0 && (
            <PanelSection title="Additional details">
              <CustomFieldsView fields={fieldDefs} values={job.customFields} />
            </PanelSection>
          )}

          <PanelSection
            title={`Pipeline, ${job.applicationCount} ${job.applicationCount === 1 ? 'applicant' : 'applicants'}`}
          >
            <div
              className="grid overflow-hidden rounded-md border border-border"
              style={{
                gridTemplateColumns: `repeat(${Math.max(flowStages.length, 1)}, minmax(0, 1fr))`,
              }}
            >
              {flowStages.map((s) => (
                <div
                  key={s.key}
                  className="border-r border-border px-3 py-2 last:border-r-0"
                >
                  <p className="text-lg font-semibold tabular-nums">
                    {job.stageCounts?.[s.key] ?? 0}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {s.name}
                  </p>
                </div>
              ))}
            </div>
            {other > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                {closedStages
                  .map(
                    (s) =>
                      `${job.stageCounts?.[s.key] ?? 0} ${s.name.toLowerCase()}`,
                  )
                  .join(', ')}
              </p>
            )}
          </PanelSection>

          <PanelSection title="Description">
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {job.description || 'No description'}
            </p>
          </PanelSection>

          <PanelSection title="Requirements">
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {job.requirements || 'No requirements'}
            </p>
          </PanelSection>

          <PanelSection title="Skills">
            <TagList items={job.skills} empty="No skills listed" />
          </PanelSection>

          <PanelSection title="Required documents">
            <TagList
              items={job.requiredDocuments}
              empty="No documents required"
            />
          </PanelSection>

          <PanelSection title="Screening questions">
            {job.screeningQuestions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No screening questions
              </p>
            ) : (
              <ol className="divide-y divide-border rounded-md border border-border">
                {job.screeningQuestions.map((q, i) => (
                  <li
                    key={q.id}
                    className="flex items-start gap-2 px-3 py-2 text-sm"
                  >
                    <span className="text-muted-foreground tabular-nums">
                      {i + 1}.
                    </span>
                    <span className="flex-1">{q.question}</span>
                    {q.required && (
                      <StatusPill tone="info">Required</StatusPill>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </PanelSection>
        </DetailPanel>
      )}
    </DetailDrawer>
  );
}
