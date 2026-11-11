'use client';

import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { zodResolver } from '@/lib/zod-resolver';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useUserNamesQuery,
} from '@/hooks/queries';
import { usePermissions } from '@/hooks/use-permissions';
import { PERMISSION_BASE } from '@/constants/permissions.constants';
import type { Task } from '@/types/task.type';
import { userDisplayName } from './task-utils';

const UNASSIGNED = 'unassigned';

const taskSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(250),
  description: z.string().optional(),
  dueAt: z.date().optional(),
  assigneeId: z.string(),
});

type TaskFormData = z.infer<typeof taskSchema>;

function toDefaults(task: Task | null, currentUserId?: string): TaskFormData {
  return {
    title: task?.title ?? '',
    description: task?.description ?? '',
    dueAt: task?.dueAt ? new Date(task.dueAt) : undefined,
    assigneeId: task
      ? (task.assigneeId ?? UNASSIGNED)
      : (currentUserId ?? UNASSIGNED),
  };
}

function toDueIso(date: Date | undefined) {
  if (!date) return null;
  const due = new Date(date);
  due.setHours(17, 0, 0, 0);
  return due.toISOString();
}

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
  currentUserId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  currentUserId?: string;
}) {
  const { hasAnyPermission } = usePermissions();
  const canListUsers = hasAnyPermission([PERMISSION_BASE.USER_LIST_READ]);
  const { data: users = [] } = useUserNamesQuery(open && canListUsers);
  const createTask = useCreateTaskMutation();
  const updateTask = useUpdateTaskMutation();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: toDefaults(task, currentUserId),
  });

  useEffect(() => {
    if (open) reset(toDefaults(task, currentUserId));
  }, [open, task, currentUserId, reset]);

  const onSubmit = async (values: TaskFormData) => {
    const payload = {
      title: values.title,
      description: values.description?.trim() || null,
      dueAt: toDueIso(values.dueAt),
      assigneeId: values.assigneeId === UNASSIGNED ? null : values.assigneeId,
    };
    try {
      if (task) {
        await updateTask.mutateAsync({ id: task.id, data: payload });
        toast.success('Task updated');
      } else {
        await createTask.mutateAsync(payload);
        toast.success('Task created');
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save task');
    }
  };

  const assigneeOptions = [...users];
  if (task?.assignee && !users.some((u) => u.id === task.assignee?.id)) {
    assigneeOptions.unshift(task.assignee);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? 'Edit task' : 'New task'}</DialogTitle>
          <DialogDescription>
            {task
              ? 'Update the details of this task'
              : 'Add a follow-up for yourself or a teammate'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              placeholder="Chase references"
              {...register('title')}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              rows={3}
              {...register('description')}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Due date</Label>
              <Controller
                name="dueAt"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="No due date"
                    clearable
                    className="w-full"
                  />
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Assignee</Label>
              <Controller
                name="assigneeId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a person" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                      {currentUserId &&
                        !assigneeOptions.some(
                          (u) => u.id === currentUserId,
                        ) && <SelectItem value={currentUserId}>Me</SelectItem>}
                      {assigneeOptions.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.id === currentUserId
                            ? `${userDisplayName(u)} (me)`
                            : userDisplayName(u)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {task ? 'Save changes' : 'Create task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
