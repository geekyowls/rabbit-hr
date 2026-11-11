'use client';

import type { ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import {
  ArrowRightLeft,
  CheckSquare,
  FileText,
  Lock,
  Mail,
  MessageSquare,
  Phone,
  UserPlus,
} from 'lucide-react';
import { zodResolver } from '@/lib/zod-resolver';
import { toast } from '@/lib/toast';
import {
  EmptyState,
  NotIntegratedBadge,
  Timeline,
  type TimelineEntry,
} from '@/components/patterns';
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
import { PermissionGuard } from '@/components/auth/permission-guard';
import { PERMISSIONS_ENUM } from '@/constants/permissions.constants';
import { useActivitiesQuery, useCreateActivityMutation } from '@/hooks/queries';
import type { Activity, ActivityType } from '@/types/activity.type';
import {
  errorMessage,
  relativeTime,
  userLabel,
} from '@/components/applications/application-meta';

const ACTIVITY_ICON: Record<ActivityType, { icon: ReactNode; color?: string }> =
  {
    note: { icon: <MessageSquare className="h-3.5 w-3.5" /> },
    stage_change: {
      icon: <ArrowRightLeft className="h-3.5 w-3.5" />,
      color: '#3F6650',
    },
    email: { icon: <Mail className="h-3.5 w-3.5" />, color: '#4C6EF5' },
    call: { icon: <Phone className="h-3.5 w-3.5" />, color: '#E0A458' },
    created: { icon: <UserPlus className="h-3.5 w-3.5" />, color: '#3F6650' },
    document: { icon: <FileText className="h-3.5 w-3.5" />, color: '#8B7DD8' },
    task: { icon: <CheckSquare className="h-3.5 w-3.5" />, color: '#3FB6A8' },
  };

export function toTimelineEntry(a: Activity, withBody = true): TimelineEntry {
  const meta = ACTIVITY_ICON[a.type];
  const notSent =
    a.type === 'email' && a.metadata && a.metadata.sent === false
      ? `Not sent: ${String(a.metadata.reason ?? 'unknown reason')}`
      : null;
  return {
    id: a.id,
    icon: meta.icon,
    color: meta.color,
    title: a.title,
    time: relativeTime(a.createdAt),
    meta: [userLabel(a.actor) || 'System', notSent].filter(Boolean).join(' · '),
    body:
      withBody && a.body ? (
        <p className="line-clamp-6 whitespace-pre-wrap text-sm text-muted-foreground">
          {a.body}
        </p>
      ) : undefined,
  };
}

const noteSchema = z.object({
  type: z.enum(['note', 'call', 'email']),
  body: z.string().trim().min(1, 'Write something first').max(5000),
});

type NoteFormData = z.infer<typeof noteSchema>;

const NOTE_TYPE_LABEL: Record<NoteFormData['type'], string> = {
  note: 'Note',
  call: 'Call log',
  email: 'Email log',
};

function NoteComposer({ candidateId }: { candidateId: string }) {
  const createActivity = useCreateActivityMutation();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: { type: 'note', body: '' },
  });

  const submit = handleSubmit(async (data) => {
    try {
      await createActivity.mutateAsync({ candidateId, ...data });
      reset({ type: data.type, body: '' });
      toast.success(`${NOTE_TYPE_LABEL[data.type]} added`);
    } catch (err) {
      toast.error('Could not save', errorMessage(err));
    }
  });

  return (
    <form onSubmit={submit} className="space-y-2">
      <Textarea
        rows={2}
        placeholder="Share a note with the hiring team"
        {...register('body')}
      />
      {errors.body && (
        <p className="text-xs text-destructive">{errors.body.message}</p>
      )}
      <div className="flex items-center justify-end gap-2">
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="h-8 w-[130px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {noteSchema.shape.type.options.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {NOTE_TYPE_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Add'}
        </Button>
      </div>
    </form>
  );
}

function SampleNoteComposer({ placeholder }: { placeholder: string }) {
  return (
    <div className="space-y-2">
      <Textarea rows={2} placeholder={placeholder} disabled />
      <div className="flex justify-end">
        <Button size="sm" disabled>
          Add note
        </Button>
      </div>
    </div>
  );
}

export function useCandidateActivities(candidateId: string, limit = 50) {
  return useActivitiesQuery({ candidateId, page: 1, limit });
}

export function CandidateActivityTab({ candidateId }: { candidateId: string }) {
  const { data, isLoading, isError } = useCandidateActivities(candidateId);
  const activities = data?.data ?? [];

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <p className="text-sm font-medium">Notes and activity</p>
        <PermissionGuard
          permissions={[
            PERMISSIONS_ENUM.CANDIDATE_UPDATE,
            PERMISSIONS_ENUM.APPLICATION_UPDATE,
          ]}
        >
          <NoteComposer candidateId={candidateId} />
        </PermissionGuard>
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : isError ? (
          <EmptyState compact title="Could not load activity" />
        ) : activities.length === 0 ? (
          <EmptyState
            compact
            title="No activity yet"
            description="Notes, stage moves, emails and documents show up here"
          />
        ) : (
          <Timeline entries={activities.map((a) => toTimelineEntry(a))} />
        )}
        {data && data.total > activities.length && (
          <p className="text-xs text-muted-foreground">
            Showing the latest {activities.length} of {data.total}
          </p>
        )}
      </section>

      <section className="space-y-3 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/20">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <Lock className="h-3.5 w-3.5" />
          Private notes
          <NotIntegratedBadge />
        </p>
        <SampleNoteComposer placeholder="Private note, only visible to you" />
        <Timeline
          entries={[
            {
              id: 'in1',
              title: 'Salary expectation slightly above band, confirm with HR',
              meta: 'Hiring manager',
              time: '3h ago',
            },
          ]}
        />
      </section>
    </div>
  );
}
