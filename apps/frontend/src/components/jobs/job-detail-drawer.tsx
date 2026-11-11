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
  NotIntegratedBadge,
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
import { JOB_PEOPLE } from './job-form-drawer';
import {
  EMPLOYMENT_TYPE_LABEL,
  JOB_STATUS_LABEL,
  JOB_STATUS_TONE,
  RATE_UNIT_LABEL,
  WORK_MODE_LABEL,
  formatMoney,
  formatPay,
  formatShortDate,
} from './job-utils';

const STAGES = [
  { key: 'applied', label: 'Applied' },
  { key: 'screening', label: 'Screening' },
  { key: 'interview', label: 'Interview' },
  { key: 'offer', label: 'Offer' },
  { key: 'placed', label: 'Placed' },
] as const;

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

  const details: [string, string][] = job
    ? [
        ['Reference', job.reference],
        ['Client', job.client?.name ?? 'No client'],
        ['Location', job.location || 'Not set'],
        ['Work mode', WORK_MODE_LABEL[job.workMode]],
        ['Employment type', EMPLOYMENT_TYPE_LABEL[job.employmentType]],
        ['Openings', String(job.openings)],
        [
          job.employmentType === 'permanent' ? 'Salary' : 'Pay rate',
          formatPay(job),
        ],
        ...(job.employmentType !== 'permanent' && job.chargeRate != null
          ? ([
              [
                'Charge rate',
                `${formatMoney(Number(job.chargeRate), job.currency || 'GBP')} ${RATE_UNIT_LABEL[job.rateUnit ?? 'hour']}`,
              ],
            ] as [string, string][])
          : []),
        ['Closing date', formatShortDate(job.closingDate) || 'Not set'],
        ['Published', formatShortDate(job.publishedAt) || 'Not published'],
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
    ? (job.stageCounts?.rejected ?? 0) + (job.stageCounts?.withdrawn ?? 0)
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

          <PanelSection title="Hiring team" action={<NotIntegratedBadge />}>
            <ul className="divide-y divide-border rounded-md border border-border">
              {[
                ['Hiring manager', JOB_PEOPLE[0]],
                ['Recruiter', JOB_PEOPLE[3]],
              ].map(([role, name]) => (
                <li
                  key={role}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm"
                >
                  <InitialsAvatar name={name} className="h-6 w-6 text-[10px]" />
                  <span className="flex-1 font-medium">{name}</span>
                  <span className="text-xs text-muted-foreground">{role}</span>
                </li>
              ))}
            </ul>
          </PanelSection>

          <PanelSection
            title={`Pipeline, ${job.applicationCount} ${job.applicationCount === 1 ? 'applicant' : 'applicants'}`}
          >
            <div className="grid grid-cols-5 overflow-hidden rounded-md border border-border">
              {STAGES.map((s) => (
                <div
                  key={s.key}
                  className="border-r border-border px-3 py-2 last:border-r-0"
                >
                  <p className="text-lg font-semibold tabular-nums">
                    {job.stageCounts?.[s.key] ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
            {other > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                {job.stageCounts.rejected ?? 0} rejected,{' '}
                {job.stageCounts.withdrawn ?? 0} withdrawn
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
