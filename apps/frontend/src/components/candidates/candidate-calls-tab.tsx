'use client';

import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import {
  PhoneIncoming,
  PhoneOutgoing,
  Pencil,
  Phone,
  type LucideIcon,
} from 'lucide-react';
import { zodResolver } from '@/lib/zod-resolver';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  EmptyState,
  StatusPill,
  ToolbarButton,
  type PillTone,
} from '@/components/patterns';
import { usePermissions } from '@/hooks/use-permissions';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';
import { useFormatters } from '@/hooks/use-formatters';
import { useCandidateCallsQuery, useUpdateCallMutation } from '@/hooks/queries';
import type {
  CallDisposition,
  CallStatus,
  CandidateCall,
} from '@/types/call.type';
import {
  errorMessage,
  userLabel,
} from '@/components/applications/application-meta';

export const CALLS_PAGE_SIZE = 10;
const NO_DISPOSITION = 'none';

const CALL_STATUS_LABEL: Record<CallStatus, string> = {
  initiated: 'In progress',
  completed: 'Completed',
  no_answer: 'No answer',
  busy: 'Busy',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

const CALL_STATUS_TONE: Record<CallStatus, PillTone> = {
  initiated: 'info',
  completed: 'success',
  no_answer: 'warning',
  busy: 'warning',
  failed: 'danger',
  cancelled: 'neutral',
};

const DISPOSITION_LABEL: Record<CallDisposition, string> = {
  connected: 'Connected',
  no_answer: 'No answer',
  voicemail: 'Left voicemail',
  busy: 'Busy',
  wrong_number: 'Wrong number',
  interested: 'Interested',
  not_interested: 'Not interested',
  callback_requested: 'Callback requested',
};

const DIRECTION: Record<
  CandidateCall['direction'],
  { icon: LucideIcon; label: string }
> = {
  outbound: { icon: PhoneOutgoing, label: 'Outbound call' },
  inbound: { icon: PhoneIncoming, label: 'Inbound call' },
};

const noteSchema = z.object({
  note: z.string().trim().max(5000),
});

type NoteFormData = z.infer<typeof noteSchema>;

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function CallNote({
  call,
  canEdit,
}: {
  call: CandidateCall;
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const update = useUpdateCallMutation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: { note: call.note ?? '' },
  });

  const submit = handleSubmit(async ({ note }) => {
    try {
      await update.mutateAsync({
        id: call.id,
        data: { note: note || null },
      });
      toast.success('Call note saved');
      setEditing(false);
    } catch (err) {
      toast.error('Could not save note', errorMessage(err));
    }
  });

  if (!editing) {
    return (
      <div className="flex items-start justify-between gap-2">
        <p
          className={
            call.note
              ? 'whitespace-pre-wrap text-sm text-foreground/90'
              : 'text-sm text-muted-foreground'
          }
        >
          {call.note || 'No note'}
        </p>
        {canEdit && (
          <ToolbarButton
            variant="ghost"
            icon={Pencil}
            onClick={() => {
              reset({ note: call.note ?? '' });
              setEditing(true);
            }}
          >
            {call.note ? 'Edit note' : 'Add note'}
          </ToolbarButton>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <Textarea
        rows={3}
        autoFocus
        aria-label="Call note"
        placeholder="What was discussed?"
        {...register('note')}
      />
      {errors.note && (
        <p className="text-xs text-destructive">{errors.note.message}</p>
      )}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setEditing(false)}
        >
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save note'}
        </Button>
      </div>
    </form>
  );
}

function CallRow({ call, canEdit }: { call: CandidateCall; canEdit: boolean }) {
  const fmt = useFormatters();
  const update = useUpdateCallMutation();
  const direction = DIRECTION[call.direction];
  const DirectionIcon = direction.icon;
  const when = call.startedAt ?? call.createdAt;

  const setDisposition = async (value: string) => {
    try {
      await update.mutateAsync({
        id: call.id,
        data: {
          disposition:
            value === NO_DISPOSITION ? null : (value as CallDisposition),
        },
      });
      toast.success('Outcome saved');
    } catch (err) {
      toast.error('Could not save outcome', errorMessage(err));
    }
  };

  return (
    <li className="space-y-3 rounded-md border border-border px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
            title={direction.label}
          >
            <DirectionIcon className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium">{direction.label}</p>
              <StatusPill tone={CALL_STATUS_TONE[call.status]}>
                {CALL_STATUS_LABEL[call.status]}
              </StatusPill>
              {call.durationSeconds > 0 && (
                <span className="text-xs tabular-nums text-muted-foreground">
                  {formatDuration(call.durationSeconds)}
                </span>
              )}
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {[
                userLabel(call.actor) || 'Unknown',
                fmt.dateTime(when),
                call.application?.job?.title,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
        </div>
        <Select
          value={call.disposition ?? NO_DISPOSITION}
          onValueChange={setDisposition}
          disabled={!canEdit || update.isPending}
        >
          <SelectTrigger
            className="h-7 w-[170px] text-xs"
            aria-label="Call outcome"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_DISPOSITION} className="text-xs">
              No outcome
            </SelectItem>
            {(Object.keys(DISPOSITION_LABEL) as CallDisposition[]).map((d) => (
              <SelectItem key={d} value={d} className="text-xs">
                {DISPOSITION_LABEL[d]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {call.recordingUrl && (
        <audio
          controls
          preload="none"
          src={call.recordingUrl}
          className="h-9 w-full"
          aria-label="Call recording"
        />
      )}
      <div className="border-t border-border pt-2">
        <CallNote call={call} canEdit={canEdit} />
      </div>
    </li>
  );
}

export function CandidateCallsTab({
  candidateId,
  actions,
}: {
  candidateId: string;
  actions?: ReactNode;
}) {
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission(PERMISSIONS_ENUM.CALL_CREATE);
  const [limit, setLimit] = useState(CALLS_PAGE_SIZE);
  const { data, isLoading, isError } = useCandidateCallsQuery(candidateId, {
    page: 1,
    limit,
  });
  const calls = data?.data ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">
          {data
            ? data.total === 1
              ? '1 call'
              : `${data.total} calls`
            : 'Calls'}
        </p>
        {actions}
      </div>
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : isError ? (
        <EmptyState compact title="Could not load calls" />
      ) : calls.length === 0 ? (
        <EmptyState
          compact
          icon={<Phone className="h-5 w-5" />}
          title="No calls yet"
          description="Calls you start from this profile are logged here with their recording"
        />
      ) : (
        <ul className="space-y-2">
          {calls.map((call) => (
            <CallRow key={call.id} call={call} canEdit={canEdit} />
          ))}
        </ul>
      )}
      {data?.hasNextPage && limit < 100 && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLimit((l) => Math.min(100, l + CALLS_PAGE_SIZE))}
          >
            Show more
          </Button>
        </div>
      )}
    </div>
  );
}
