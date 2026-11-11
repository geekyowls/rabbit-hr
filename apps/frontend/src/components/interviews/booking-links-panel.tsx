'use client';

import { useMemo, useState } from 'react';
import { Link2 } from 'lucide-react';
import { toast } from '@/lib/toast';
import { useFormatters } from '@/hooks/use-formatters';
import { usePermissions } from '@/hooks/use-permissions';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';
import {
  useApplicationQuery,
  useBookingLinksQuery,
  useCancelBookingLinkMutation,
} from '@/hooks/queries';
import {
  AvatarStack,
  DataGrid,
  EmptyState,
  FilterDropdown,
  RowActions,
  StatusPill,
  type DataGridColumn,
  type PillTone,
  type RowAction,
} from '@/components/patterns';
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
import { Skeleton } from '@/components/ui/skeleton';
import { copyText } from '@/components/integrations/copy-field';
import { errorMessage } from '@/components/applications/application-meta';
import type { BookingLink, BookingLinkStatus } from '@/types/booking-link.type';
import {
  INTERVIEW_TYPE_LABEL,
  formatDuration,
  personLabel,
} from './interview-data';

const ALL = 'all';

const STATUS_LABEL: Record<BookingLinkStatus, string> = {
  open: 'Waiting for candidate',
  booked: 'Booked',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

const STATUS_TONE: Record<BookingLinkStatus, PillTone> = {
  open: 'info',
  booked: 'success',
  cancelled: 'neutral',
  expired: 'warning',
};

const STATUS_OPTIONS = [
  { value: ALL, label: 'Any' },
  { value: 'open', label: 'Waiting for candidate' },
  { value: 'booked', label: 'Booked' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
];

function CandidateCell({ link }: { link: BookingLink }) {
  const { data } = useApplicationQuery(link.applicationId);
  if (!data) return <Skeleton className="h-4 w-32" />;
  return (
    <span className="block min-w-0">
      <span className="block truncate font-medium">
        {`${data.candidate.firstName} ${data.candidate.lastName}`.trim()}
      </span>
      <span className="block truncate text-xs text-muted-foreground">
        {data.job.title}
      </span>
    </span>
  );
}

export function BookingLinksPanel({
  onOpenInterview,
}: {
  onOpenInterview: (id: string) => void;
}) {
  const fmt = useFormatters();
  const { hasPermission } = usePermissions();
  const canCancel = hasPermission(PERMISSIONS_ENUM.INTERVIEW_UPDATE);
  const [status, setStatus] = useState<string>(ALL);
  const { data = [], isLoading } = useBookingLinksQuery(
    status === ALL ? {} : { status: status as BookingLinkStatus },
  );
  const cancel = useCancelBookingLinkMutation();
  const [cancelling, setCancelling] = useState<BookingLink | null>(null);

  const confirmCancel = async () => {
    if (!cancelling) return;
    try {
      await cancel.mutateAsync(cancelling.id);
      toast.success('Booking link cancelled');
    } catch (err) {
      toast.error('Could not cancel booking link', errorMessage(err));
    } finally {
      setCancelling(null);
    }
  };

  const columns = useMemo<DataGridColumn<BookingLink>[]>(
    () => [
      {
        key: 'candidate',
        header: 'Candidate',
        width: 220,
        render: (r) => <CandidateCell link={r} />,
      },
      {
        key: 'interview',
        header: 'Interview',
        width: 200,
        render: (r) => (
          <span className="block min-w-0">
            <span className="block truncate">{r.title}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {`${INTERVIEW_TYPE_LABEL[r.type]}, ${formatDuration(r.durationMinutes)}`}
            </span>
          </span>
        ),
      },
      {
        key: 'panel',
        header: 'Panel',
        width: 120,
        render: (r) => (
          <span className="flex items-center gap-2">
            <AvatarStack
              items={r.interviewers.map((i) => ({ name: personLabel(i) }))}
              max={3}
              size={22}
            />
            <span className="text-xs text-muted-foreground">
              {r.mode === 'all_interviewers' ? 'All' : 'Any'}
            </span>
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        width: 170,
        render: (r) => (
          <StatusPill tone={STATUS_TONE[r.status]} dot>
            {STATUS_LABEL[r.status]}
          </StatusPill>
        ),
      },
      {
        key: 'when',
        header: 'Booked for or expires',
        width: 190,
        render: (r) =>
          r.bookedInterview ? (
            <span className="tabular-nums">
              {`${fmt.dateLong(r.bookedInterview.scheduledAt, {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}, ${fmt.time(r.bookedInterview.scheduledAt)}`}
            </span>
          ) : (
            <span className="tabular-nums text-muted-foreground">
              {r.status === 'open'
                ? `Expires ${fmt.dateLong(r.expiresAt)}`
                : fmt.dateLong(r.cancelledAt ?? r.expiresAt)}
            </span>
          ),
      },
      {
        key: 'created',
        header: 'Sent',
        width: 110,
        render: (r) => (
          <span className="text-muted-foreground">
            {fmt.relative(r.createdAt)}
          </span>
        ),
      },
      {
        key: 'actions',
        header: '',
        width: 56,
        render: (r) => {
          const actions: RowAction[] = [];
          if (r.status === 'open') {
            actions.push({
              label: 'Copy link',
              onSelect: async () => {
                if (await copyText(r.url)) toast.success('Link copied');
              },
            });
          }
          if (r.bookedInterviewId) {
            const id = r.bookedInterviewId;
            actions.push({
              label: 'Open interview',
              onSelect: () => onOpenInterview(id),
            });
          }
          if (r.status === 'open' && canCancel) {
            actions.push({
              label: 'Cancel link',
              onSelect: () => setCancelling(r),
              destructive: true,
            });
          }
          if (actions.length === 0) return null;
          return (
            <span onClick={(e) => e.stopPropagation()}>
              <RowActions actions={actions} />
            </span>
          );
        },
      },
    ],
    [fmt, canCancel, onOpenInterview],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-center gap-2">
        <FilterDropdown
          label="Status"
          value={status}
          options={STATUS_OPTIONS}
          onChange={setStatus}
        />
        <span className="text-xs text-muted-foreground">
          Candidates pick their own time from these links
        </span>
      </div>
      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : data.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-md border border-border bg-card">
          <EmptyState
            icon={<Link2 className="h-8 w-8" />}
            title="No booking links"
            description="Send one from here or from the schedule drawer"
          />
        </div>
      ) : (
        <DataGrid
          columns={columns}
          rows={data}
          getRowId={(r) => r.id}
          onRowClick={(r) =>
            r.bookedInterviewId && onOpenInterview(r.bookedInterviewId)
          }
          maxHeight="100%"
          className="flex-1"
        />
      )}

      <AlertDialog
        open={!!cancelling}
        onOpenChange={(o) => !o && setCancelling(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel booking link</AlertDialogTitle>
            <AlertDialogDescription>
              The candidate can no longer use this link to book a time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep link</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel}>
              Cancel link
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
