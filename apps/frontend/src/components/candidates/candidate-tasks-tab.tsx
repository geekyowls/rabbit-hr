'use client';

import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { CalendarDays, CheckCircle2, Circle, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';
import { zodResolver } from '@/lib/zod-resolver';
import { toast } from '@/lib/toast';
import { EmptyState } from '@/components/patterns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { usePermissions } from '@/hooks/use-permissions';
import { useSession } from '@/contexts/session-context';
import {
  PERMISSION_BASE,
  PERMISSIONS_ENUM,
} from '@/constants/permissions.constants';
import {
  useCompleteTaskMutation,
  useCreateTaskMutation,
  useTasksQuery,
  useUserNamesQuery,
} from '@/hooks/queries';
import type { CandidateDetail } from '@/types/candidate.type';
import {
  errorMessage,
  shortDate,
  userLabel,
} from '@/components/applications/application-meta';

const UNASSIGNED = 'unassigned';

const taskSchema = z.object({
  title: z.string().trim().min(1, 'Add a task title').max(200),
  dueAt: z.date().nullable(),
  assigneeId: z.string(),
  applicationId: z.string(),
});

type TaskFormData = z.infer<typeof taskSchema>;

const NO_APPLICATION = 'none';

function AddTaskForm({ candidate }: { candidate: CandidateDetail }) {
  const { user } = useSession();
  const { hasPermission } = usePermissions();
  const { data: users = [] } = useUserNamesQuery(
    hasPermission(PERMISSION_BASE.USER_LIST_READ),
  );
  const createTask = useCreateTaskMutation();
  const defaults: TaskFormData = {
    title: '',
    dueAt: null,
    assigneeId: user?.userId ?? UNASSIGNED,
    applicationId: NO_APPLICATION,
  };
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: defaults,
  });

  const assignees = users.some((u) => u.id === user?.userId)
    ? users
    : user
      ? [
          {
            id: user.userId,
            firstName: user.firstName ?? null,
            lastName: user.lastName ?? null,
            email: user.email,
          },
          ...users,
        ]
      : users;

  const submit = handleSubmit(async (data) => {
    const application = candidate.applications.find(
      (a) => a.id === data.applicationId,
    );
    try {
      await createTask.mutateAsync({
        title: data.title,
        candidateId: candidate.id,
        dueAt: data.dueAt ? data.dueAt.toISOString() : null,
        assigneeId: data.assigneeId === UNASSIGNED ? null : data.assigneeId,
        ...(application && {
          applicationId: application.id,
          jobId: application.jobId,
          clientId: application.clientId,
        }),
      });
      toast.success('Task added');
      reset(defaults);
    } catch (err) {
      toast.error('Could not add task', errorMessage(err));
    }
  });

  return (
    <form
      onSubmit={submit}
      className="space-y-2 rounded-md border border-border p-3"
    >
      <Input
        className="h-9"
        placeholder="Add a task, for example call to confirm availability"
        {...register('title')}
      />
      {errors.title && (
        <p className="text-xs text-destructive">{errors.title.message}</p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Controller
          name="dueAt"
          control={control}
          render={({ field }) => (
            <DatePicker
              value={field.value ?? undefined}
              onChange={(d) => field.onChange(d ?? null)}
              placeholder="Due date"
              clearable
              minDate={new Date(new Date().setHours(0, 0, 0, 0))}
              className="h-8 w-[170px]"
            />
          )}
        />
        <Controller
          name="assigneeId"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="h-8 w-[170px] text-xs">
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED} className="text-xs">
                  Unassigned
                </SelectItem>
                {assignees.map((u) => (
                  <SelectItem key={u.id} value={u.id} className="text-xs">
                    {u.id === user?.userId
                      ? `${userLabel(u)} (me)`
                      : userLabel(u)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {candidate.applications.length > 0 && (
          <Controller
            name="applicationId"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-8 w-[180px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_APPLICATION} className="text-xs">
                    Not linked to a job
                  </SelectItem>
                  {candidate.applications.map((a) => (
                    <SelectItem key={a.id} value={a.id} className="text-xs">
                      {a.jobTitle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        )}
        <Button
          type="submit"
          size="sm"
          className="ml-auto"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Adding...' : 'Add task'}
        </Button>
      </div>
    </form>
  );
}

export function CandidateTasksTab({
  candidate,
}: {
  candidate: CandidateDetail;
}) {
  const { hasPermission } = usePermissions();
  const canComplete = hasPermission(PERMISSIONS_ENUM.TASK_UPDATE);
  const { data, isLoading, isError } = useTasksQuery(
    { page: 1, limit: 50, candidateId: candidate.id },
    hasPermission(PERMISSIONS_ENUM.TASK_LIST_READ),
  );
  const completeTask = useCompleteTaskMutation();
  const tasks = [...(data?.data ?? [])].sort((a, b) =>
    a.status === b.status ? 0 : a.status === 'open' ? -1 : 1,
  );

  const complete = async (id: string) => {
    try {
      await completeTask.mutateAsync(id);
      toast.success('Task completed');
    } catch (err) {
      toast.error('Could not complete task', errorMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      <PermissionGuard permissions={PERMISSIONS_ENUM.TASK_CREATE}>
        <AddTaskForm candidate={candidate} />
      </PermissionGuard>

      <PermissionGuard
        permissions={PERMISSIONS_ENUM.TASK_LIST_READ}
        fallback={
          <EmptyState compact title="You do not have access to tasks" />
        }
      >
        {isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        ) : isError ? (
          <EmptyState compact title="Could not load tasks" />
        ) : tasks.length === 0 ? (
          <EmptyState
            compact
            icon={<ListTodo className="h-5 w-5" />}
            title="No tasks for this candidate"
            description="Add follow ups like reference checks or availability calls"
          />
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border">
            {tasks.map((t) => {
              const done = t.status === 'done';
              const overdue =
                !done && !!t.dueAt && new Date(t.dueAt).getTime() < Date.now();
              return (
                <li key={t.id} className="flex items-center gap-3 px-3 py-2.5">
                  <button
                    type="button"
                    disabled={done || !canComplete || completeTask.isPending}
                    onClick={() => complete(t.id)}
                    aria-label={done ? 'Completed' : 'Mark as done'}
                    className="text-muted-foreground hover:text-[#3F6650] disabled:cursor-default dark:hover:text-[#8FBFA1]"
                  >
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 text-[#3F6650] dark:text-[#8FBFA1]" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'truncate text-sm',
                        done && 'text-muted-foreground line-through',
                      )}
                    >
                      {t.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[
                        t.job?.title,
                        t.assignee ? userLabel(t.assignee) : 'Unassigned',
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  {t.dueAt && (
                    <span
                      className={cn(
                        'inline-flex shrink-0 items-center gap-1 text-xs',
                        overdue
                          ? 'font-medium text-red-600 dark:text-red-400'
                          : 'text-muted-foreground',
                      )}
                    >
                      <CalendarDays className="h-3 w-3" />
                      {shortDate(t.dueAt)}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </PermissionGuard>
    </div>
  );
}
