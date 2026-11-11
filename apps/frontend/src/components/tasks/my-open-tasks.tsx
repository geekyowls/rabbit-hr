'use client';

import Link from 'next/link';
import { Check, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { useCompleteTaskMutation } from '@/hooks/queries';
import { EmptyState } from '@/components/patterns';
import type { Task } from '@/types/task.type';
import {
  TASK_DUE_CLASS,
  formatTaskDue,
  getTaskDueState,
  taskLinkLabel,
} from './task-utils';

export function MyOpenTasks({
  tasks,
  canComplete,
}: {
  tasks: Task[];
  canComplete: boolean;
}) {
  const completeTask = useCompleteTaskMutation();

  const handleComplete = async (task: Task) => {
    try {
      await completeTask.mutateAsync(task.id);
      toast.success('Task completed');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not complete task',
      );
    }
  };

  if (tasks.length === 0) {
    return (
      <EmptyState
        compact
        icon={<ListTodo className="h-6 w-6" />}
        title="No open tasks"
        description="Tasks assigned to you will show up here"
      />
    );
  }

  return (
    <ul className="divide-y divide-border">
      {tasks.map((task) => {
        const state = getTaskDueState(task);
        const due = formatTaskDue(task.dueAt);
        const link = taskLinkLabel(task);
        const pending =
          completeTask.isPending && completeTask.variables === task.id;
        return (
          <li key={task.id} className="flex items-center gap-3 px-4 py-2.5">
            {canComplete && (
              <button
                type="button"
                aria-label={`Mark ${task.title} as done`}
                disabled={pending}
                onClick={() => handleComplete(task)}
                className="group flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-input hover:border-[#3F6650] hover:bg-[#3F6650]/10 disabled:opacity-50 dark:hover:border-[#8FBFA1]"
              >
                <Check className="h-3 w-3 text-[#3F6650] opacity-0 group-hover:opacity-100 dark:text-[#8FBFA1]" />
              </button>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{task.title}</p>
              {link && (
                <p className="truncate text-xs text-muted-foreground">{link}</p>
              )}
            </div>
            {due && (
              <span
                className={cn(
                  'shrink-0 text-xs tabular-nums',
                  state ? TASK_DUE_CLASS[state] : 'text-muted-foreground',
                )}
              >
                {state === 'today' ? 'Today' : due}
              </span>
            )}
          </li>
        );
      })}
      <li>
        <Link
          href="/dashboard/tasks"
          className="block px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground"
        >
          View all tasks
        </Link>
      </li>
    </ul>
  );
}
